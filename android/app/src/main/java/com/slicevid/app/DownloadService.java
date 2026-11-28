package com.slicevid.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.ContentValues;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.media.MediaExtractor;
import android.media.MediaFormat;
import android.os.Environment;
import android.os.IBinder;
import android.os.PowerManager;
import android.provider.DocumentsContract;
import android.provider.MediaStore;
import androidx.core.app.NotificationCompat;
import com.yausername.youtubedl_android.YoutubeDL;
import com.yausername.youtubedl_android.YoutubeDLRequest;
import com.yausername.ffmpeg.FFmpeg;
import com.yausername.aria2c.Aria2c;
import java.io.File;
import java.io.FileInputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.UUID;
import java.util.Arrays;
import kotlin.Unit;

/** A visible foreground service owns the subprocess, not the Activity/WebView. */
public class DownloadService extends Service {
    private static final String CHANNEL = "slicevid_downloads";
    private static final int ID = 4412;
    static volatile boolean running = false;
    private long lastProgress;

    private SharedPreferences prefs() { return getSharedPreferences("download_state", MODE_PRIVATE); }

    @Override public void onCreate() {
        super.onCreate();
        getSystemService(NotificationManager.class).createNotificationChannel(new NotificationChannel(CHANNEL, "SliceVid downloads", NotificationManager.IMPORTANCE_LOW));
    }

    private Notification notification(String text, int percent, boolean ongoing) {
        Intent open = new Intent(this, MainActivity.class);
        PendingIntent tap = PendingIntent.getActivity(this, 0, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        return new NotificationCompat.Builder(this, CHANNEL)
            .setSmallIcon(android.R.drawable.stat_sys_download)
            .setContentTitle("SliceVid")
            .setContentText(text)
            .setContentIntent(tap)
            .setOnlyAlertOnce(true)
            .setOngoing(ongoing)
            .setProgress(100, Math.max(0, percent), ongoing && percent < 0)
            .build();
    }

    private void state(String state, String message, int percent) {
        prefs().edit().putString("state", state).putString("message", message).putInt("percent", percent).apply();
        if ("running".equals(state)) getSystemService(NotificationManager.class).notify(ID, notification(message, percent, true));
    }

    @Override public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null || running) return START_NOT_STICKY;
        running = true;
        startForeground(ID, notification("ئامادەکردنی دابەزاندن...", -1, true));
        state("running", "ئامادەکردنی دابەزاندن...", -1);
        new Thread(() -> runJob(intent, startId), "slicevid-download").start();
        return START_NOT_STICKY;
    }

    private void runJob(Intent intent, int startId) {
        File dir = new File(getCacheDir(), "job-" + UUID.randomUUID());
        String resultState = "done", resultMessage;
        PowerManager.WakeLock wakeLock = ((PowerManager) getSystemService(POWER_SERVICE)).newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "SliceVid:download");
        wakeLock.acquire(6 * 60 * 60 * 1000L);
        try {
            String link = intent.getStringExtra("url");
            String kind = intent.getStringExtra("kind");
            String format = intent.getStringExtra("format");
            if (link == null || format == null || kind == null || !dir.mkdirs()) throw new Exception("نەتوانرا دابەزاندن دەست پێ بکرێت.");
            YoutubeDL.getInstance().init(getApplicationContext());
            FFmpeg.getInstance().init(getApplicationContext());
            final int clipDuration = intent.getIntExtra("end", 0) - intent.getIntExtra("start", 0);
            boolean fast = DownloadSpeed.useParallel(kind, intent.getIntExtra("end", 0));
            if (fast) {
                try { Aria2c.getInstance().init(getApplicationContext()); }
                catch (Exception ignored) { fast = false; }
            }
            final boolean parallelAvailable = fast;
            boolean useFastClip = ClipDownload.useBoundedRequests(kind, format, intent.getIntExtra("end", 0));
            if (useFastClip && !ClipDownload.isUsable(new File(getApplicationInfo().nativeLibraryDir, "libffmpeg_slice.so"), getNoBackupFilesDir())) {
                useFastClip = false;
                state("running", "ڕێگای خێرا بەردەست نییە؛ دابەزاندن بە ڕێگای ئاسایی...", -1);
            }
            final boolean boundedAvailable = useFastClip;
            File output;
            String subtitleLanguage = intent.getStringExtra("language");
            if (kind.equals("subtitle")) {
                boolean tryAutomatic = intent.getBooleanExtra("tryAutomatic", false) && intent.getIntExtra("end", 0) > 0;
                String[] manual = intent.getIntExtra("end", 0) > 0 ? intent.getStringArrayExtra("fallbackManual") : null;
                String[] automatic = intent.getIntExtra("end", 0) > 0 ? intent.getStringArrayExtra("fallbackAutomatic") : null;
                SubtitleDownload.Result<File> result = SubtitleDownload.run(subtitleLanguage, tryAutomatic, manual, automatic, (language, automaticOnly) -> {
                    downloadWithRetry(intent, dir, parallelAvailable, boundedAvailable, kind, clipDuration, automaticOnly, language);
                    return prepareOutput(intent, dir, kind, format, clipDuration);
                }, () -> state("running", "ژێرنووسێکی تر تاقی دەکرێتەوە...", -1), () -> clearJobFiles(dir));
                output = result.value;
                subtitleLanguage = result.language;
            } else {
                downloadWithRetry(intent, dir, parallelAvailable, boundedAvailable, kind, clipDuration, false, null);
                output = prepareOutput(intent, dir, kind, format, clipDuration);
            }
            state("running", "پاشەکەوتکردنی فایل...", -1);
            publish(output, format, intent.getStringExtra("folder"), kind.equals("subtitle") ? subtitleLanguage : null);
            resultMessage = kind.equals("subtitle")
                ? "ژێرنووس پاشەکەوت کرا. زمان: " + subtitleLanguage
                : "تەواو بوو ✓ فایلەکە لە شوێنی هەڵبژێردراو پاشەکەوت کرا.";
        } catch (Exception e) {
            resultState = "error";
            resultMessage = DownloadFailure.userMessage(e);
        } finally {
            File[] files = dir.listFiles(); if (files != null) for (File f : files) f.delete(); dir.delete();
            if (wakeLock.isHeld()) wakeLock.release();
        }
        state(resultState, resultMessage, "done".equals(resultState) ? 100 : 0);
        running = false;
        stopForeground(STOP_FOREGROUND_REMOVE);
        getSystemService(NotificationManager.class).notify(ID, notification(resultMessage, 100, false));
        stopSelf();
    }

    private void downloadWithRetry(Intent intent, File dir, boolean parallel, boolean bounded, String kind, int clipDuration, boolean automaticOnly, String subtitleLanguage) throws Exception {
        DownloadRetry.run(
            alternate -> executeWithFallback(intent, dir, alternate, parallel, bounded, kind, clipDuration, automaticOnly, subtitleLanguage),
            () -> {
                state("running", "یوتوب ڕێگەی نەدا؛ نوێکردنەوە و هەوڵدانەوە...", -1);
                YoutubeDL.getInstance().updateYoutubeDL(getApplicationContext(), YoutubeDL.UpdateChannel._STABLE);
            },
            () -> clearJobFiles(dir),
            () -> state("running", "ڕێگایەکی تری دابەزاندن تاقی دەکرێتەوە...", -1)
        );
    }

    private File prepareOutput(Intent intent, File dir, String kind, String format, int clipDuration) throws Exception {
        File[] outputs = dir.listFiles((d, name) -> name.endsWith("." + format));
        if (outputs == null || outputs.length == 0) throw new Exception("فایلەکە بەردەست نییە یان دروست نەبوو.");
        // The final video has an exact name; other MP4s may be intermediates.
        File output = kind.equals("subtitle") ? outputs[0] : new File(dir, "download." + format);
        if (!output.isFile()) throw new Exception("فایلی تەواوی ڤیدیۆکە دروست نەبوو.");
        if (format.equals("mp4")) validateMp4(output, clipDuration);
        if (kind.equals("subtitle") && intent.getIntExtra("end", 0) > 0) {
            long startMs = intent.getIntExtra("start", 0) * 1000L;
            long endMs = intent.getIntExtra("end", 0) * 1000L;
            if (output.length() > 30L * 1024 * 1024) throw new Exception("فایلی ژێرنووس زۆر گەورەیە.");
            String text = new String(Files.readAllBytes(output.toPath()), StandardCharsets.UTF_8);
            String trimmed = SubtitleTrimmer.trim(text, format, startMs, endMs);
            output = new File(dir, "section." + format);
            Files.write(output.toPath(), trimmed.getBytes(StandardCharsets.UTF_8));
        }
        return output;
    }

    private YoutubeDLRequest buildRequest(Intent intent, File dir, boolean alternate, boolean parallel, ClipDownload.Mode mode, boolean automaticOnly, String subtitleLanguage) {
        String link = intent.getStringExtra("url"), kind = intent.getStringExtra("kind"), format = intent.getStringExtra("format");
        YoutubeDLRequest r = new YoutubeDLRequest(link);
        r.addOption("--no-playlist"); r.addOption("--no-warnings");
        r.addOption("--concurrent-fragments", "4");
        if (parallel) {
            r.addOption("--downloader", "libaria2c.so");
            r.addOption("--downloader-args", "aria2c:-x 8 -s 8 -k 1M");
        }
        r.addOption("--socket-timeout", "30"); r.addOption("--retries", "3"); r.addOption("--fragment-retries", "3");
        r.addOption("-o", new File(dir, "download.%(ext)s").getAbsolutePath());
        if (kind.equals("subtitle")) {
            r.addOption("--skip-download");
            if (!automaticOnly) r.addOption("--write-subs");
            r.addOption("--write-auto-subs");
            r.addOption("--sub-langs", subtitleLanguage);
            r.addOption("--sub-format", "vtt/best"); r.addOption("--convert-subs", format);
        } else {
            int start = intent.getIntExtra("start", 0), end = intent.getIntExtra("end", 0);
            if (end > 0) {
                r.addOption("--download-sections", "*" + start + "-" + end);
                if (mode != ClipDownload.Mode.LEGACY && ClipDownload.useBoundedRequests(kind, format, end)) {
                    File clipFfmpeg = new File(getApplicationInfo().nativeLibraryDir, "libffmpeg_slice.so");
                    if (!clipFfmpeg.isFile()) throw new IllegalStateException("ئامێری دابەزاندنی بەش لە ئەپەکەدا نەدۆزرایەوە.");
                    // The wrapper adds its own ffmpeg location; custom commands follow it.
                    r.addCommands(Arrays.asList("--ffmpeg-location", clipFfmpeg.getAbsolutePath()));
                    r.addOption("--downloader-args", mode == ClipDownload.Mode.PREVIOUS ? ClipDownload.PREVIOUS_INPUT_ARGS : ClipDownload.INPUT_ARGS);
                }
                // MP4 stream copy keeps the original encoding; edit-list support varies by player.
                if (!ClipDownload.useBoundedRequests(kind, format, end)) r.addOption("--force-keyframes-at-cuts");
                r.addOption("--downloader-args", "ffmpeg:-progress pipe:1 -nostats");
            }
            if (format.equals("mp3")) { r.addOption("-x"); r.addOption("--audio-format", "mp3"); }
            else {
                String quality = intent.getStringExtra("quality");
                String cap = "best".equals(quality) ? "" : "[height<=" + quality + "]";
                if (format.equals("mp4")) {
                    // Some Android players cannot display AV1/VP9 inside MP4.
                    String h264 = "[ext=mp4][vcodec^=avc1]" + cap;
                    r.addOption("-f", "bv" + h264 + "+ba[ext=m4a][acodec^=mp4a]/b" + h264 + "[acodec^=mp4a]");
                    r.addOption("--merge-output-format", "mp4");
                } else {
                    r.addOption("-f", "bv" + cap + "+ba/b" + cap);
                    r.addOption("--merge-output-format", format); r.addOption("--recode-video", format);
                }
            }
        }
        if (alternate || (kind.equals("subtitle") && "web_safari".equals(intent.getStringExtra("subtitleClient"))))
            r.addOption("--extractor-args", "youtube:player_client=web_safari");
        return r;
    }

    private void executeWithFallback(Intent intent, File dir, boolean alternate, boolean parallel, boolean bounded, String kind, int clipDuration, boolean automaticOnly, String subtitleLanguage) throws Exception {
        ClipDownload.run(bounded, mode ->
            DownloadSpeed.run(parallel,
                fast -> {
                    executeRequest(buildRequest(intent, dir, alternate, fast, mode, automaticOnly, subtitleLanguage), intent, kind, clipDuration, mode != ClipDownload.Mode.LEGACY);
                    if (ClipDownload.useBoundedRequests(kind, intent.getStringExtra("format"), intent.getIntExtra("end", 0))) {
                        File output = new File(dir, "download.mp4");
                        if (!output.isFile()) throw new Exception("فایلی تەواوی ڤیدیۆکە دروست نەبوو.");
                        validateMp4(output, clipDuration);
                    }
                },
                () -> state("running", "دابەزاندن بە ڕێگای ئاسایی دووبارە دەست پێ دەکات...", -1),
                () -> clearJobFiles(dir)),
            () -> state("running", "فایلەکە تەواو نەبوو یان ڕێگاکە کارینەکرد؛ ڕێگایەکی تر تاقی دەکرێتەوە...", -1),
            () -> clearJobFiles(dir));
    }

    private void executeRequest(YoutubeDLRequest request, Intent intent, String kind, int clipDuration, boolean bounded) throws Exception {
        YoutubeDL.getInstance().execute(request, UUID.randomUUID().toString(), (p, eta, line) -> {
            long now = System.currentTimeMillis();
            if (now - lastProgress > 700) {
                int percent = DownloadProgress.percent(line, p, kind.equals("video") && intent.getIntExtra("end", 0) > 0 ? clipDuration : 0);
                if (percent >= 0) {
                    lastProgress = now;
                    String label = ClipDownload.useBoundedRequests(kind, intent.getStringExtra("format"), intent.getIntExtra("end", 0))
                        ? (bounded ? "بڕینی خێرا" : "بڕینی ئاسایی") : "قۆناغی ئێستا";
                    state("running", label + "... " + percent + "%", percent);
                }
            }
            return Unit.INSTANCE;
        });
    }

    private void clearJobFiles(File dir) throws Exception {
        File[] files = dir.listFiles();
        if (files != null) for (File file : files) {
            if (file.isDirectory()) clearJobFiles(file);
            if (!file.delete()) throw new Exception("نەتوانرا فایلە کاتییەکان بسڕدرێنەوە.");
        }
    }

    private void validateMp4(File file, int clipDuration) throws Exception {
        MediaExtractor extractor = new MediaExtractor();
        boolean video = false, audio = false;
        ClipDownload.IncompleteClipException incomplete = null;
        try {
            extractor.setDataSource(file.getAbsolutePath());
            for (int i = 0; i < extractor.getTrackCount(); i++) {
                MediaFormat track = extractor.getTrackFormat(i);
                String mime = track.getString(MediaFormat.KEY_MIME);
                if ("video/avc".equals(mime)) video = true;
                if ("audio/mp4a-latm".equals(mime)) audio = true;
                if (("video/avc".equals(mime) || "audio/mp4a-latm".equals(mime)) && track.containsKey(MediaFormat.KEY_DURATION)) {
                    long actualUs = track.getLong(MediaFormat.KEY_DURATION);
                    if (incomplete == null && ClipDownload.durationTooShort(actualUs, clipDuration)) {
                        incomplete = new ClipDownload.IncompleteClipException("video/avc".equals(mime) ? "وێنە" : "دەنگ", actualUs, clipDuration);
                    }
                }
            }
        } finally { extractor.release(); }
        if (incomplete != null) throw incomplete;
        if (!video || !audio) throw new Exception("فایلی MP4 وێنە و دەنگی سازگاری تێدا نەدۆزرایەوە. تکایە کوالێتییەکی تر تاقی بکەرەوە.");
    }

    private void publish(File file, String extension, String folder, String subtitleLanguage) throws Exception {
        String mime = extension.equals("mp3") ? "audio/mpeg" : extension.equals("mp4") ? "video/mp4" : extension.equals("webm") ? "video/webm" : "text/plain";
        String filename = "SliceVid-" + System.currentTimeMillis() + (subtitleLanguage == null ? "" : "-" + subtitleLanguage) + "." + extension;
        Uri destination;
        boolean media = folder == null || folder.isEmpty();
        if (media) {
            ContentValues values = new ContentValues();
            values.put(MediaStore.Downloads.DISPLAY_NAME, filename); values.put(MediaStore.Downloads.MIME_TYPE, mime);
            values.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/SliceVid");
            values.put(MediaStore.Downloads.IS_PENDING, 1);
            destination = getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
        } else {
            Uri tree = Uri.parse(folder);
            Uri root = DocumentsContract.buildDocumentUriUsingTree(tree, DocumentsContract.getTreeDocumentId(tree));
            destination = DocumentsContract.createDocument(getContentResolver(), root, mime, filename);
        }
        if (destination == null) throw new Exception("نەتوانرا فایلەکە لە شوێنی هەڵبژێردراو پاشەکەوت بکرێت.");
        try {
            try (FileInputStream in = new FileInputStream(file); OutputStream out = getContentResolver().openOutputStream(destination)) {
                if (out == null) throw new Exception("نەتوانرا فایل بنووسرێت.");
                byte[] buffer = new byte[65536]; int n;
                while ((n = in.read(buffer)) != -1) out.write(buffer, 0, n);
            }
            if (media) { ContentValues values = new ContentValues(); values.put(MediaStore.Downloads.IS_PENDING, 0); getContentResolver().update(destination, values, null, null); }
        } catch (Exception e) {
            try { if (media) getContentResolver().delete(destination, null, null); else DocumentsContract.deleteDocument(getContentResolver(), destination); } catch (Exception ignored) { }
            throw e;
        }
    }

    @Override public IBinder onBind(Intent intent) { return null; }
    @Override public void onDestroy() { super.onDestroy(); running = false; }
}
