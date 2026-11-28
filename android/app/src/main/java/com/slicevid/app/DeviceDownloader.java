package com.slicevid.app;

import android.content.ContentValues;
import android.net.Uri;
import android.os.Environment;
import android.provider.MediaStore;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.yausername.youtubedl_android.YoutubeDL;
import com.yausername.youtubedl_android.YoutubeDLRequest;
import com.yausername.ffmpeg.FFmpeg;
import org.json.JSONObject;
import java.io.File;
import java.io.FileInputStream;
import java.io.OutputStream;
import java.util.Iterator;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import kotlin.Unit;

@CapacitorPlugin(name = "DeviceDownloader")
public class DeviceDownloader extends Plugin {
    private final ExecutorService worker = Executors.newSingleThreadExecutor();

    private void initialize() throws Exception {
        YoutubeDL.getInstance().init(getContext().getApplicationContext());
        FFmpeg.getInstance().init(getContext().getApplicationContext());
        // The extractor changes regularly. Refresh at most once per day; if it
        // cannot be refreshed, the bundled copy still gets a chance to work.
        long last = getContext().getSharedPreferences("extractor", 0).getLong("updated", 0);
        if (System.currentTimeMillis() - last > 86400000L) {
            try {
                YoutubeDL.getInstance().updateYoutubeDL(getContext(), YoutubeDL.UpdateChannel._STABLE);
                getContext().getSharedPreferences("extractor", 0).edit().putLong("updated", System.currentTimeMillis()).apply();
            } catch (Exception ignored) { }
        }
    }

    private String url(PluginCall call) throws Exception {
        String value = call.getString("url", "").trim();
        Uri u = Uri.parse(value);
        String host = u.getHost();
        if (!"https".equalsIgnoreCase(u.getScheme()) || host == null ||
            !(host.equalsIgnoreCase("youtube.com") || host.equalsIgnoreCase("www.youtube.com") ||
              host.equalsIgnoreCase("m.youtube.com") || host.equalsIgnoreCase("music.youtube.com") || host.equalsIgnoreCase("youtu.be")))
            throw new Exception("تکایە لینکێکی دروستی YouTube دابنێ.");
        return value;
    }

    private YoutubeDLRequest request(String url) {
        YoutubeDLRequest r = new YoutubeDLRequest(url);
        r.addOption("--no-playlist");
        r.addOption("--no-warnings");
        return r;
    }

    private void fail(PluginCall call, Exception error) {
        String msg = error.getMessage();
        if (msg == null || msg.trim().isEmpty()) msg = "نەتوانرا کارەکە تەواو بکرێت. پەیوەندی ئینتەرنێت و لینکەکە بپشکنە.";
        if (msg.length() > 350) msg = msg.substring(0, 350);
        call.reject(msg);
    }

    @PluginMethod
    public void info(PluginCall call) {
        worker.execute(() -> {
            try {
                String link = url(call);
                initialize();
                YoutubeDLRequest r = request(link);
                r.addOption("--dump-single-json");
                r.addOption("--skip-download");
                JSONObject raw = new JSONObject(YoutubeDL.getInstance().execute(r).getOut());
                JSObject out = new JSObject();
                out.put("title", raw.optString("title", "Video"));
                out.put("channel", raw.optString("uploader", ""));
                out.put("duration", raw.optDouble("duration", 0));
                out.put("thumbnail", raw.optString("thumbnail", ""));
                JSArray subs = new JSArray();
                java.util.LinkedHashSet<String> langs = new java.util.LinkedHashSet<>();
                for (String type : new String[]{"subtitles", "automatic_captions"}) {
                    JSONObject tracks = raw.optJSONObject(type);
                    if (tracks != null) {
                        Iterator<String> keys = tracks.keys();
                        while (keys.hasNext()) {
                            String k = keys.next();
                            if (k.matches("[A-Za-z0-9_-]{1,35}")) langs.add(k);
                        }
                    }
                }
                for (String lang : langs) subs.put(lang);
                out.put("subtitles", subs);
                call.resolve(out);
            } catch (Exception e) { fail(call, e); }
        });
    }

    private void progress(float progress) {
        JSObject data = new JSObject();
        data.put("percent", Math.max(0, Math.min(100, (int) progress)));
        notifyListeners("downloadProgress", data);
    }

    private void publish(File file, String extension) throws Exception {
        ContentValues values = new ContentValues();
        values.put(MediaStore.Downloads.DISPLAY_NAME, "SliceVid-" + System.currentTimeMillis() + "." + extension);
        values.put(MediaStore.Downloads.MIME_TYPE, extension.equals("mp3") ? "audio/mpeg" : extension.equals("mp4") ? "video/mp4" : extension.equals("webm") ? "video/webm" : "text/plain");
        values.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/SliceVid");
        values.put(MediaStore.Downloads.IS_PENDING, 1);
        Uri destination = getContext().getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
        if (destination == null) throw new Exception("نەتوانرا فایل لە Downloads پاشەکەوت بکرێت.");
        try {
            try (FileInputStream in = new FileInputStream(file); OutputStream out = getContext().getContentResolver().openOutputStream(destination)) {
                if (out == null) throw new Exception("نەتوانرا فایل بنووسرێت.");
                byte[] buffer = new byte[64 * 1024];
                int n;
                while ((n = in.read(buffer)) != -1) out.write(buffer, 0, n);
            }
            values.clear();
            values.put(MediaStore.Downloads.IS_PENDING, 0);
            getContext().getContentResolver().update(destination, values, null, null);
        } catch (Exception e) {
            getContext().getContentResolver().delete(destination, null, null);
            throw e;
        }
    }

    private File findOutput(File dir, String extension) throws Exception {
        File[] files = dir.listFiles((d, name) -> name.endsWith("." + extension));
        if (files == null || files.length == 0) throw new Exception("فایلە داواکراوەکە دروست نەبوو؛ ڕەنگە ئەم فۆرماتە بەردەست نەبێت.");
        return files[0];
    }

    @PluginMethod
    public void download(PluginCall call) {
        worker.execute(() -> {
            File dir = new File(getContext().getCacheDir(), "slice-" + UUID.randomUUID());
            try {
                String link = url(call);
                String format = call.getString("format", "mp4");
                String quality = call.getString("quality", "best");
                if (!format.matches("mp4|mp3|webm") || !quality.matches("best|360|480|720|1080")) throw new Exception("فۆرماتەکە دروست نییە.");
                Double start = call.getDouble("start", 0.0), end = call.getDouble("end", 0.0);
                if (start < 0 || end < 0 || (end > 0 && end <= start) || (start > 0 && end == 0)) throw new Exception("کاتی دەستپێک و کۆتایی بپشکنە.");
                if (!dir.mkdirs()) throw new Exception("نەتوانرا شوێنی کاتی دروست بکرێت.");
                initialize();
                YoutubeDLRequest r = request(link);
                r.addOption("-o", new File(dir, "clip.%(ext)s").getAbsolutePath());
                if (end > 0) {
                    r.addOption("--download-sections", "*" + start.intValue() + "-" + end.intValue());
                    r.addOption("--force-keyframes-at-cuts");
                }
                if (format.equals("mp3")) {
                    r.addOption("-x"); r.addOption("--audio-format", "mp3");
                } else {
                    String cap = quality.equals("best") ? "" : "[height<=" + quality + "]";
                    r.addOption("-f", "bv*" + cap + "+ba/b" + cap);
                    r.addOption("--merge-output-format", format);
                    r.addOption("--recode-video", format);
                }
                YoutubeDL.getInstance().execute(r, UUID.randomUUID().toString(), (p, eta, line) -> { progress(p); return Unit.INSTANCE; });
                publish(findOutput(dir, format), format);
                call.resolve();
            } catch (Exception e) { fail(call, e); }
            finally { File[] files = dir.listFiles(); if (files != null) for (File f : files) f.delete(); dir.delete(); }
        });
    }

    @PluginMethod
    public void subtitles(PluginCall call) {
        worker.execute(() -> {
            File dir = new File(getContext().getCacheDir(), "subs-" + UUID.randomUUID());
            try {
                String link = url(call), lang = call.getString("language", ""), format = call.getString("format", "srt");
                if (!lang.matches("[A-Za-z0-9_-]{1,35}") || !format.matches("srt|vtt")) throw new Exception("زمان یان فۆرماتەکە دروست نییە.");
                if (!dir.mkdirs()) throw new Exception("نەتوانرا شوێنی کاتی دروست بکرێت.");
                initialize();
                YoutubeDLRequest r = request(link);
                r.addOption("--skip-download"); r.addOption("--write-subs"); r.addOption("--write-auto-subs");
                r.addOption("--sub-langs", lang); r.addOption("--sub-format", "vtt/best"); r.addOption("--convert-subs", format);
                r.addOption("-o", new File(dir, "captions.%(ext)s").getAbsolutePath());
                YoutubeDL.getInstance().execute(r);
                publish(findOutput(dir, format), format);
                call.resolve();
            } catch (Exception e) { fail(call, e); }
            finally { File[] files = dir.listFiles(); if (files != null) for (File f : files) f.delete(); dir.delete(); }
        });
    }
}
