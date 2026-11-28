package com.slicevid.app;

import android.app.Activity;
import android.content.Intent;
import android.content.SharedPreferences;
import androidx.activity.result.ActivityResult;
import androidx.core.content.ContextCompat;
import com.getcapacitor.annotation.ActivityCallback;
import android.provider.DocumentsContract;
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

    @PluginMethod
    public void chooseFolder(PluginCall call) {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT_TREE);
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION | Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION);
        startActivityForResult(call, intent, "folderResult");
    }

    @ActivityCallback
    private void folderResult(PluginCall call, ActivityResult result) {
        if (call == null) return;
        Intent data = result.getData();
        if (result.getResultCode() != Activity.RESULT_OK || data == null || data.getData() == null) {
            call.reject("هیچ بوخچەیەک هەڵنەبژێردرا."); return;
        }
        try {
            Uri uri = data.getData();
            int flags = data.getFlags() & (Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
            getContext().getContentResolver().takePersistableUriPermission(uri, flags);
            getContext().getSharedPreferences("download_settings", 0).edit().putString("folder", uri.toString()).apply();
            call.resolve(folderInfo());
        } catch (Exception e) { fail(call, e); }
    }

    private JSObject folderInfo() {
        String folder = getContext().getSharedPreferences("download_settings", 0).getString("folder", "");
        String label = "Downloads / SliceVid";
        try { if (!folder.isEmpty()) label = DocumentsContract.getTreeDocumentId(Uri.parse(folder)).replace(':', '/'); } catch (Exception ignored) { }
        return new JSObject().put("label", label);
    }

    @PluginMethod
    public void getFolder(PluginCall call) { call.resolve(folderInfo()); }

    @PluginMethod
    public void status(PluginCall call) {
        SharedPreferences p = getContext().getSharedPreferences("download_state", 0);
        String state = p.getString("state", "idle");
        if (("running".equals(state) && !DownloadService.running) ||
            ("queued".equals(state) && System.currentTimeMillis() - p.getLong("queued_at", 0) > 30000 && !DownloadService.running)) {
            state = "error";
            p.edit().putString("state", state).putString("message", "دابەزاندن وەستا؛ تکایە دووبارە هەوڵ بدەوە.").apply();
        }
        JSObject result = new JSObject();
        result.put("state", state); result.put("message", p.getString("message", "")); result.put("percent", p.getInt("percent", 0));
        call.resolve(result);
    }

    private void begin(PluginCall call, boolean subtitles) {
        boolean queuedCreated = false;
        try {
            String link = url(call);
            String priorState = getContext().getSharedPreferences("download_state", 0).getString("state", "idle");
            if (DownloadService.running || "queued".equals(priorState)) throw new Exception("دابەزاندنێک هێشتا بەردەوامە.");
            String format = call.getString("format", subtitles ? "srt" : "mp4");
            if (subtitles ? !format.matches("srt|vtt") : !format.matches("mp4|mp3|webm")) throw new Exception("فۆرماتەکە دروست نییە.");
            String quality = call.getString("quality", "best");
            String language = call.getString("language", "");
            if (!quality.matches("best|360|480|720|1080") || (subtitles && !language.matches("[A-Za-z0-9_-]{1,35}"))) throw new Exception("هەڵبژاردنەکە دروست نییە.");
            double start = call.getDouble("start", 0.0), end = call.getDouble("end", 0.0);
            if (!Double.isFinite(start) || !Double.isFinite(end) || start < 0 || end < 0 || end > Integer.MAX_VALUE || (end > 0 && end <= start) || (start > 0 && end == 0)) throw new Exception("کاتی دەستپێک و کۆتایی بپشکنە.");
            Intent intent = new Intent(getContext(), DownloadService.class);
            intent.putExtra("url", link); intent.putExtra("kind", subtitles ? "subtitle" : "video");
            intent.putExtra("format", format); intent.putExtra("quality", quality); intent.putExtra("language", language);
            intent.putExtra("start", (int) start); intent.putExtra("end", (int) end);
            intent.putExtra("folder", getContext().getSharedPreferences("download_settings", 0).getString("folder", ""));
            getContext().getSharedPreferences("download_state", 0).edit().putString("state", "queued").putString("message", "ئامادەکردنی دابەزاندن...").putLong("queued_at", System.currentTimeMillis()).putInt("percent", 0).apply();
            queuedCreated = true;
            ContextCompat.startForegroundService(getContext(), intent);
            call.resolve();
        } catch (Exception e) {
            if (queuedCreated && !DownloadService.running)
                getContext().getSharedPreferences("download_state", 0).edit().putString("state", "error").putString("message", "نەتوانرا دابەزاندن دەست پێ بکرێت.").apply();
            fail(call, e);
        }
    }

    @PluginMethod public void download(PluginCall call) { begin(call, false); }
    @PluginMethod public void subtitles(PluginCall call) { begin(call, true); }
}
