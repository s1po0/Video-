package com.videoupscaler.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.os.IBinder;
import android.os.ParcelFileDescriptor;
import android.os.PowerManager;
import android.provider.MediaStore;
import android.provider.OpenableColumns;
import android.util.Log;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.Locale;

/**
 * Foreground service that performs the upscaling job.
 *
 * <p>Running here (instead of inside the activity) means the work keeps going
 * when the user leaves the app, locks the screen, or the activity is destroyed
 * by the system. A persistent notification shows the percentage, ETA and a
 * cancel button, exactly like a download manager.
 */
public class UpscaleService extends Service {

    private static final String TAG = "UpscaleService";

    static final String CHANNEL_ID = "upscale_job";
    static final int NOTIFICATION_ID = 41;

    static final String ACTION_START = "com.videoupscaler.app.START";
    static final String ACTION_CANCEL = "com.videoupscaler.app.CANCEL";

    static final String EXTRA_URI = "uri";
    static final String EXTRA_NAME = "name";
    static final String EXTRA_SIZE = "size";
    static final String EXTRA_SCALE = "scale";
    static final String EXTRA_QUALITY = "quality";
    static final String EXTRA_SHARPEN = "sharpen";
    static final String EXTRA_CODEC = "codec";
    static final String EXTRA_AUDIO = "audio";
    static final String EXTRA_ROTATION = "rotation";

    private static volatile UpscaleService instance;
    private volatile VideoEngine engine;
    private Thread worker;
    private PowerManager.WakeLock wakeLock;
    private NotificationManager nm;
    private long lastNotify = 0;

    static boolean isRunning() {
        return instance != null;
    }

    static void cancelFromAnywhere() {
        UpscaleService s = instance;
        if (s != null) {
            VideoEngine e = s.engine;
            if (e != null) e.requestCancel();
        }
    }

    @Override
    public void onCreate() {
        super.onCreate();
        instance = this;
        nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        createChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null) return START_NOT_STICKY;

        if (ACTION_CANCEL.equals(intent.getAction())) {
            cancelFromAnywhere();
            updateNotification(getString(R.string.status_cancelling), 0, "");
            stopSelf();
            return START_NOT_STICKY;
        }

        startForeground(NOTIFICATION_ID, buildNotification(getString(R.string.status_preparing), 0, ""));

        if (worker == null || !worker.isAlive()) {
            final Intent job = intent;
            worker = new Thread(() -> runJob(job), "upscale-service");
            worker.start();
        }
        return START_NOT_STICKY;
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onDestroy() {
        instance = null;
        super.onDestroy();
    }

    // --------------------------------------------------------------- job ----

    private void runJob(Intent intent) {
        Uri uri = intent.getParcelableExtra(EXTRA_URI);
        String name = intent.getStringExtra(EXTRA_NAME);
        long size = intent.getLongExtra(EXTRA_SIZE, 0);
        int scale = intent.getIntExtra(EXTRA_SCALE, 2);
        int quality = intent.getIntExtra(EXTRA_QUALITY, 1);
        int sharpen = intent.getIntExtra(EXTRA_SHARPEN, 45);
        int codec = intent.getIntExtra(EXTRA_CODEC, 0);
        boolean audio = intent.getBooleanExtra(EXTRA_AUDIO, true);
        int rotation = intent.getIntExtra(EXTRA_ROTATION, 0);

        Device.init(this);

        JobState.reset();
        JobState.running = true;
        JobState.fileName = name == null ? "" : name;
        JobState.startedAt = System.currentTimeMillis();

        PowerManager pm = (PowerManager) getSystemService(POWER_SERVICE);
        if (pm != null) {
            wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "VideoUpscaler:job");
            wakeLock.acquire(8 * 60 * 60 * 1000L);
        }

        File local = null;
        try {
            if (uri == null) throw new Exception(getString(R.string.err_open));

            setStatus(getString(R.string.status_preparing), 0.004f, -1);
            local = copyToCache(uri, size);

            VideoEngine.Config cfg = new VideoEngine.Config();
            cfg.scale = scale;
            cfg.quality = quality;
            cfg.sharpen = sharpen;
            cfg.codec = codec;
            cfg.copyAudio = audio;
            cfg.rotationDegrees = rotation;

            transcodeAndPublish(local, cfg, name);

        } catch (VideoEngine.CancelledException ce) {
            boolean hot = isTooHot();
            JobState.running = false;
            JobState.status = getString(hot ? R.string.status_too_hot : R.string.status_cancelled);
            JobState.error = "";
            JobState.cancelled = true;
            JobState.finishedAt = System.currentTimeMillis();
            notifyFinished(JobState.status, false);
        } catch (Throwable t) {
            Log.e(TAG, "job failed", t);
            String msg = t.getMessage() == null ? t.getClass().getSimpleName() : t.getMessage();
            JobState.running = false;
            JobState.error = msg;
            JobState.status = getString(R.string.status_failed, msg);
            JobState.finishedAt = System.currentTimeMillis();
            notifyFinished(JobState.status, true);
        } finally {
            if (local != null) //noinspection ResultOfMethodCallIgnored
                local.delete();
            engine = null;
            JobState.running = false;
            if (wakeLock != null && wakeLock.isHeld()) wakeLock.release();
            stopForeground(false);
            stopSelf();
        }
    }

    private void transcodeAndPublish(File input, VideoEngine.Config cfg, String displayName)
            throws Exception {
        long t0 = System.currentTimeMillis();
        Destination dest = openDestination(displayName);
        File written = dest.file;
        boolean ok = false;

        JobState.fraction = 0.03f;
        JobState.status = getString(R.string.status_analysing);
        updateNotification(JobState.status, JobState.fraction, "");

        try {
            VideoEngine eng = new VideoEngine((fraction, detail, etaMs) -> {
                long now = System.currentTimeMillis();
                JobState.fraction = 0.03f + fraction * 0.90f;
                JobState.detail = detail;
                JobState.etaMs = etaMs;
                JobState.etaLabel = etaMs > 0
                        ? getString(R.string.eta, formatDuration(etaMs)) : "";
                if (now - lastNotify > 1000) {
                    lastNotify = now;
                    updateNotification(detail, JobState.fraction, JobState.etaLabel);
                }
            });
            engine = eng;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                eng.thermalProbe = () -> {
                    PowerManager pm = (PowerManager) getSystemService(POWER_SERVICE);
                    return pm == null ? 0 : pm.getCurrentThermalStatus();
                };
            }

            // The encoder always writes to an ordinary cache file first. Writing
            // straight into a MediaStore file descriptor produces empty/unreadable
            // videos on a number of devices, so we copy afterwards instead.
            VideoEngine.Result result = eng.transcode(input.getAbsolutePath(),
                    written.getAbsolutePath(), null, cfg);

            if (written.length() < 1024) {
                throw new Exception(getString(R.string.err_bad_output));
            }

            JobState.fraction = 0.94f;
            JobState.status = getString(R.string.status_finalising);
            updateNotification(JobState.status, 0.94f, "");

            Uri published = dest.publish(written, displayName,
                    result.outputWidth, result.outputHeight);

            JobState.publishedUri = published;
            JobState.outputPath = dest.keepFile ? written.getAbsolutePath() : null;
            JobState.outWidth = result.outputWidth;
            JobState.outHeight = result.outputHeight;
            JobState.fraction = 1f;
            JobState.etaMs = -1;
            JobState.etaLabel = "";
            JobState.running = false;
            JobState.resultMessage = getString(R.string.status_done,
                    result.outputWidth, result.outputHeight,
                    String.format(Locale.US, "%.0f", (System.currentTimeMillis() - t0) / 1000.0));
            JobState.status = JobState.resultMessage;
            JobState.finishedAt = System.currentTimeMillis();
            notifyFinished(JobState.resultMessage, false);
            saveLastResult(published, JobState.outputPath, result.outputWidth,
                    result.outputHeight, JobState.resultMessage);
            ok = true;

        } finally {
            if (!dest.keepFile) {
                //noinspection ResultOfMethodCallIgnored
                written.delete();
            }
            if (!ok) dest.abort();
        }
    }

    // ------------------------------------------------------- destination ----

    private final class Destination {
        /** Where the encoder writes. Always a plain file inside our cache. */
        File file;
        /** True when {@link #file} is the final, user-visible output (legacy path). */
        boolean keepFile;
        /** MediaStore row created on Android 10+ while the copy is in flight. */
        Uri pendingUri;

        /** Copies the finished file to the gallery / Movies and returns its public uri. */
        Uri publish(File written, String originalName, int w, int h) throws Exception {
            String name = outputName(originalName);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                if (pendingUri == null) pendingUri = insertPending(name);
                if (pendingUri == null) throw new Exception(getString(R.string.err_no_space));

                JobState.status = getString(R.string.status_saving);
                try (OutputStream out = getContentResolver().openOutputStream(pendingUri, "w")) {
                    if (out == null) throw new Exception(getString(R.string.err_no_space));
                    copyWithProgress(written, out, 0.94f, 0.995f);
                }

                ContentValues done = new ContentValues();
                done.put(MediaStore.Video.Media.IS_PENDING, 0);
                getContentResolver().update(pendingUri, done, null, null);

                // Verify the row really is readable before we tell the user it worked.
                if (!isReadable(pendingUri)) throw new Exception(getString(R.string.err_bad_output));
                return pendingUri;
            }

            // Android 9 and below: no MediaStore pending rows, write to Movies directly.
            File dir = new File(Environment.getExternalStoragePublicDirectory(
                    Environment.DIRECTORY_MOVIES), "Video Upscaler");
            if (!dir.exists() && !dir.mkdirs()) throw new Exception(getString(R.string.err_no_space));
            File target = uniqueFile(dir, name);
            JobState.status = getString(R.string.status_saving);
            try (OutputStream out = new FileOutputStream(target)) {
                copyWithProgress(written, out, 0.94f, 0.995f);
            }
            if (target.length() < 1024) {
                //noinspection ResultOfMethodCallIgnored
                target.delete();
                throw new Exception(getString(R.string.err_bad_output));
            }
            //noinspection ResultOfMethodCallIgnored
            written.delete();
            keepFile = true;
            file = target;
            sendScan(target);
            return Uri.fromFile(target);
        }

        void abort() {
            if (pendingUri != null) {
                try { getContentResolver().delete(pendingUri, null, null); } catch (Exception ignored) { }
            }
            if (keepFile && file != null && file.exists()) {
                //noinspection ResultOfMethodCallIgnored
                file.delete();
            }
        }
    }

    private Uri insertPending(String name) {
        ContentValues v = new ContentValues();
        v.put(MediaStore.Video.Media.DISPLAY_NAME, name);
        v.put(MediaStore.Video.Media.MIME_TYPE, "video/mp4");
        v.put(MediaStore.Video.Media.RELATIVE_PATH,
                Environment.DIRECTORY_MOVIES + "/Video Upscaler");
        v.put(MediaStore.Video.Media.IS_PENDING, 1);
        return getContentResolver().insert(MediaStore.Video.Media.EXTERNAL_CONTENT_URI, v);
    }

    private boolean isReadable(Uri uri) {
        try (ParcelFileDescriptor p = getContentResolver().openFileDescriptor(uri, "r")) {
            return p != null && p.getStatSize() > 1024;
        } catch (Exception e) {
            return false;
        }
    }

    private void copyWithProgress(File src, OutputStream out, float from, float to)
            throws Exception {
        long total = Math.max(1, src.length());
        long done = 0;
        try (InputStream in = new FileInputStream(src)) {
            byte[] buf = new byte[1 << 16];
            int n;
            while ((n = in.read(buf)) > 0) {
                if (!JobState.running) throw new VideoEngine.CancelledException();
                out.write(buf, 0, n);
                done += n;
                JobState.fraction = from + (to - from) * Math.min(1f, done / (float) total);
            }
            out.flush();
        }
    }

    @SuppressWarnings("deprecation")
    private void sendScan(File f) {
        try {
            sendBroadcast(new Intent(Intent.ACTION_MEDIA_SCANNER_SCAN_FILE, Uri.fromFile(f)));
        } catch (Exception ignored) { }
    }

    private Destination openDestination(String displayName) {
        Destination d = new Destination();
        d.file = new File(getCacheDir(), "out_" + System.currentTimeMillis() + ".mp4");
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            // Reserve the gallery row up front so the date/name look right.
            d.pendingUri = insertPending(outputName(displayName));
        }
        return d;
    }

    private static String outputName(String displayName) {
        String base = displayName == null || displayName.isEmpty() ? "video" : displayName;
        int dot = base.lastIndexOf('.');
        if (dot > 0) base = base.substring(0, dot);
        if (base.trim().isEmpty()) base = "video";
        return base + "_upscaled.mp4";
    }

    private static File uniqueFile(File dir, String name) {
        File f = new File(dir, name);
        if (!f.exists()) return f;
        int dot = name.lastIndexOf('.');
        String stem = dot > 0 ? name.substring(0, dot) : name;
        String ext = dot > 0 ? name.substring(dot) : "";
        for (int i = 2; i < 1000; i++) {
            f = new File(dir, stem + "_" + i + ext);
            if (!f.exists()) return f;
        }
        return new File(dir, System.currentTimeMillis() + ext);
    }

    private File copyToCache(Uri uri, long declaredSize) throws Exception {
        File target = new File(getCacheDir(), "input_" + System.currentTimeMillis() + ".mp4");
        InputStream in;
        try {
            in = getContentResolver().openInputStream(uri);
        } catch (Exception e) {
            throw new Exception(getString(R.string.err_open));
        }
        if (in == null) throw new Exception(getString(R.string.err_open));

        long total = declaredSize > 0 ? declaredSize : querySize(uri);
        long copied = 0;
        long free = getCacheDir().getUsableSpace();
        long limit = free > 0 ? free : Long.MAX_VALUE;

        try (OutputStream out = new FileOutputStream(target)) {
            byte[] buf = new byte[1 << 16];
            int n;
            while ((n = in.read(buf)) > 0) {
                if (!JobState.running) throw new VideoEngine.CancelledException();
                out.write(buf, 0, n);
                copied += n;
                if (copied > limit) throw new Exception(getString(R.string.err_no_space));
                if (total > 0) {
                    float f = Math.min(0.025f, copied / (float) total * 0.025f);
                    JobState.fraction = 0.004f + f;
                    if (System.currentTimeMillis() - lastNotify > 1000) {
                        lastNotify = System.currentTimeMillis();
                        updateNotification(getString(R.string.status_preparing),
                                JobState.fraction, "");
                    }
                }
            }
        } finally {
            try { in.close(); } catch (Exception ignored) { }
        }
        if (copied < 1024) throw new Exception(getString(R.string.err_empty_file));
        return target;
    }

    private long querySize(Uri uri) {
        try (Cursor c = getContentResolver().query(uri, null, null, null, null)) {
            if (c != null && c.moveToFirst()) {
                int i = c.getColumnIndex(OpenableColumns.SIZE);
                if (i >= 0 && !c.isNull(i)) return c.getLong(i);
            }
        } catch (Exception ignored) { }
        return 0;
    }

    // ------------------------------------------------------- notification ---

    private void createChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O || nm == null) return;
        NotificationChannel ch = new NotificationChannel(CHANNEL_ID,
                getString(R.string.notif_channel), NotificationManager.IMPORTANCE_LOW);
        ch.setDescription(getString(R.string.notif_channel_desc));
        ch.setShowBadge(false);
        ch.setSound(null, null);
        nm.createNotificationChannel(ch);
    }

    private PendingIntent contentIntent() {
        Intent i = new Intent(this, MainActivity.class);
        i.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) flags |= PendingIntent.FLAG_IMMUTABLE;
        return PendingIntent.getActivity(this, 0, i, flags);
    }

    private PendingIntent cancelIntent() {
        Intent i = new Intent(this, UpscaleService.class).setAction(ACTION_CANCEL);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) flags |= PendingIntent.FLAG_IMMUTABLE;
        return PendingIntent.getService(this, 1, i, flags);
    }

    @SuppressWarnings("deprecation")
    private Notification buildNotification(String text, float fraction, String eta) {
        Notification.Builder b = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                ? new Notification.Builder(this, CHANNEL_ID)
                : new Notification.Builder(this);

        b.setSmallIcon(android.R.drawable.stat_sys_upload)
                .setContentTitle(getString(R.string.notif_title))
                .setContentText(eta == null || eta.isEmpty() ? text : text + "  ·  " + eta)
                .setContentIntent(contentIntent())
                .setOngoing(true)
                .setOnlyAlertOnce(true)
                .setShowWhen(false)
                .addAction(new Notification.Action.Builder(
                        android.R.drawable.ic_menu_close_clear_cancel,
                        getString(R.string.cancel), cancelIntent()).build());

        if (fraction > 0f && fraction < 1f) {
            b.setProgress(1000, Math.round(fraction * 1000), false);
            b.setSubText(Math.round(fraction * 100) + "%");
        } else {
            b.setProgress(0, 0, false);
        }
        return b.build();
    }

    private void updateNotification(String text, float fraction, String eta) {
        if (nm == null) return;
        try {
            nm.notify(NOTIFICATION_ID, buildNotification(text, fraction, eta));
        } catch (Exception e) {
            Log.w(TAG, "notify failed: " + e.getMessage());
        }
    }

    /** Shows the final "done" (or "failed") notification, tappable to open the app. */
    private void notifyFinished(String text, boolean error) {
        if (nm == null) return;
        Notification.Builder b = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                ? new Notification.Builder(this, CHANNEL_ID)
                : new Notification.Builder(this);
        b.setSmallIcon(error ? android.R.drawable.stat_notify_error
                        : android.R.drawable.stat_sys_download_done)
                .setContentTitle(getString(R.string.notif_finished))
                .setContentText(text)
                .setStyle(new Notification.BigTextStyle().bigText(text))
                .setContentIntent(contentIntent())
                .setAutoCancel(true)
                .setOngoing(false);
        try {
            nm.notify(NOTIFICATION_ID + 1, b.build());
        } catch (Exception ignored) { }
    }

    private boolean isTooHot() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) return false;
        PowerManager pm = (PowerManager) getSystemService(POWER_SERVICE);
        return pm != null && pm.getCurrentThermalStatus() >= PowerManager.THERMAL_STATUS_SEVERE;
    }

    // ------------------------------------------------------- last result ----

    static final String PREFS = "upscale_last";
    static final String K_URI = "uri";
    static final String K_PATH = "path";
    static final String K_NAME = "name";
    static final String K_W = "w";
    static final String K_H = "h";
    static final String K_MSG = "msg";
    static final String K_AT = "at";

    private void saveLastResult(Uri uri, String path, int w, int h, String message) {
        try {
            getSharedPreferences(PREFS, MODE_PRIVATE).edit()
                    .putString(K_URI, uri == null ? null : uri.toString())
                    .putString(K_PATH, path)
                    .putString(K_NAME, outputName(JobState.fileName))
                    .putInt(K_W, w)
                    .putInt(K_H, h)
                    .putString(K_MSG, message)
                    .putLong(K_AT, System.currentTimeMillis())
                    .apply();
        } catch (Exception ignored) { }
    }

    // ------------------------------------------------------------ helpers ---

    private void setStatus(String status, float fraction, long etaMs) {
        JobState.status = status;
        JobState.fraction = fraction;
        JobState.etaMs = etaMs;
        updateNotification(status, fraction, "");
    }

    static String formatDuration(long ms) {
        long total = Math.max(0, ms) / 1000;
        long h = total / 3600;
        long m = (total % 3600) / 60;
        long s = total % 60;
        return h > 0 ? String.format(Locale.US, "%d:%02d:%02d", h, m, s)
                : String.format(Locale.US, "%d:%02d", m, s);
    }

    static Intent jobIntent(Context c, Uri uri, String name, long size,
                            int scale, int quality, int sharpen, int codec,
                            boolean audio, int rotation) {
        return new Intent(c, UpscaleService.class)
                .setAction(ACTION_START)
                .putExtra(EXTRA_URI, uri)
                .putExtra(EXTRA_NAME, name)
                .putExtra(EXTRA_SIZE, size)
                .putExtra(EXTRA_SCALE, scale)
                .putExtra(EXTRA_QUALITY, quality)
                .putExtra(EXTRA_SHARPEN, sharpen)
                .putExtra(EXTRA_CODEC, codec)
                .putExtra(EXTRA_AUDIO, audio)
                .putExtra(EXTRA_ROTATION, rotation);
    }
}
