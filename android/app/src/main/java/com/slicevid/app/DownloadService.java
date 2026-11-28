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
import java.io.File;
import java.io.FileInputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.UUID;
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
            YoutubeDLRequest r = new YoutubeDLRequest(link);
            r.addOption("--no-playlist"); r.addOption("--no-warnings");
            r.addOption("--concurrent-fragments", "4");
            r.addOption("--socket-timeout", "30"); r.addOption("--retries", "3"); r.addOption("--fragment-retries", "3");
            r.addOption("-o", new File(dir, "download.%(ext)s").getAbsolutePath());
            if (kind.equals("subtitle")) {
                r.addOption("--skip-download"); r.addOption("--write-subs"); r.addOption("--write-auto-subs");
                r.addOption("--sub-langs", intent.getStringExtra("language"));
                r.addOption("--sub-format", "vtt/best"); r.addOption("--convert-subs", format);
            } else {
                int start = intent.getIntExtra("start", 0), end = intent.getIntExtra("end", 0);
                if (end > 0) {
                    r.addOption("--download-sections", "*" + start + "-" + end);
                    r.addOption("--force-keyframes-at-cuts");
                    // yt-dlp delegates sections to ffmpeg, whose ordinary progress
                    // is on stderr and is not forwarded by the Android wrapper.
                    // H.264 re-encoding is needed for precise clip/subtitle timing.
                    // A faster x264 preset reduces CPU time without changing codecs.
                    r.addOption("--downloader-args", "ffmpeg:-progress pipe:1 -nostats" + (format.equals("mp4") ? " -preset veryfast" : ""));
                }
                if (format.equals("mp3")) { r.addOption("-x"); r.addOption("--audio-format", "mp3"); }
                else {
                    String quality = intent.getStringExtra("quality");
                    String cap = "best".equals(quality) ? "" : "[height<=" + quality + "]";
                    if (format.equals("mp4")) {
                        // Do not choose AV1/VP9 just because it has an .mp4 container:
                        // some Android players render only audio for those streams.
                        // Prefer an actual H.264 video stream and AAC audio, or a
                        // progressive MP4 containing both. Fail if none exists.
                        String h264 = "[ext=mp4][vcodec^=avc1]" + cap;
                        r.addOption("-f", "bv" + h264 + "+ba[ext=m4a][acodec^=mp4a]/b" + h264 + "[acodec^=mp4a]");
                        r.addOption("--merge-output-format", "mp4");
                    } else {
                        r.addOption("-f", "bv" + cap + "+ba/b" + cap);
                        r.addOption("--merge-output-format", format); r.addOption("--recode-video", format);
                    }
                }
            }
            final int clipDuration = intent.getIntExtra("end", 0) - intent.getIntExtra("start", 0);
            YoutubeDL.getInstance().execute(r, UUID.randomUUID().toString(), (p, eta, line) -> {
                long now = System.currentTimeMillis();
                if (now - lastProgress > 700) {
                    int percent = DownloadProgress.percent(line, p, kind.equals("video") && intent.getIntExtra("end", 0) > 0 ? clipDuration : 0);
                    if (percent >= 0) {
                        lastProgress = now;
                        state("running", "قۆناغی ئێستا... " + percent + "%", percent);
                    }
                }
                return Unit.INSTANCE;
            });
            state("running", "پاشەکەوتکردنی فایل...", -1);
            File[] outputs = dir.listFiles((d, name) -> name.endsWith("." + format));
            if (outputs == null || outputs.length == 0) throw new Exception("فایلەکە بەردەست نییە یان دروست نەبوو.");
            // yt-dlp's final media file has this exact name. Never select an
            // intermediate audio/video fragment merely because it ends in .mp4.
            File output = kind.equals("subtitle") ? outputs[0] : new File(dir, "download." + format);
            if (!output.isFile()) throw new Exception("فایلی تەواوی ڤیدیۆکە دروست نەبوو.");
            if (format.equals("mp4")) validateMp4(output);
            if (kind.equals("subtitle") && intent.getIntExtra("end", 0) > 0) {
                long startMs = intent.getIntExtra("start", 0) * 1000L;
                long endMs = intent.getIntExtra("end", 0) * 1000L;
                if (output.length() > 30L * 1024 * 1024) throw new Exception("فایلی ژێرنووس زۆر گەورەیە.");
                String text = new String(Files.readAllBytes(output.toPath()), StandardCharsets.UTF_8);
                String trimmed = SubtitleTrimmer.trim(text, format, startMs, endMs);
                output = new File(dir, "section." + format);
                Files.write(output.toPath(), trimmed.getBytes(StandardCharsets.UTF_8));
            }
            publish(output, format, intent.getStringExtra("folder"));
            resultMessage = "تەواو بوو ✓ فایلەکە لە شوێنی هەڵبژێردراو پاشەکەوت کرا.";
        } catch (Exception e) {
            resultState = "error";
            resultMessage = e.getMessage();
            if (resultMessage == null || resultMessage.isEmpty()) resultMessage = "دابەزاندن سەرکەوتوو نەبوو. ئینتەرنێت و لینکەکە بپشکنە.";
            if (resultMessage.length() > 350) resultMessage = resultMessage.substring(0, 350);
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

    private void validateMp4(File file) throws Exception {
        MediaExtractor extractor = new MediaExtractor();
        boolean video = false, audio = false;
        try {
            extractor.setDataSource(file.getAbsolutePath());
            for (int i = 0; i < extractor.getTrackCount(); i++) {
                MediaFormat track = extractor.getTrackFormat(i);
                String mime = track.getString(MediaFormat.KEY_MIME);
                if ("video/avc".equals(mime)) video = true;
                if ("audio/mp4a-latm".equals(mime)) audio = true;
            }
        } finally { extractor.release(); }
        if (!video || !audio) throw new Exception("فایلی MP4 وێنە و دەنگی سازگاری تێدا نەدۆزرایەوە. تکایە کوالێتییەکی تر تاقی بکەرەوە.");
    }

    private void publish(File file, String extension, String folder) throws Exception {
        String mime = extension.equals("mp3") ? "audio/mpeg" : extension.equals("mp4") ? "video/mp4" : extension.equals("webm") ? "video/webm" : "text/plain";
        String filename = "SliceVid-" + System.currentTimeMillis() + "." + extension;
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
