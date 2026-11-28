package com.slicevid.app;

import android.app.DownloadManager;
import android.content.ContentValues;
import android.content.Context;
import android.net.Uri;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.OutputStream;

@CapacitorPlugin(name = "NativeDownloads")
public class NativeDownloads extends Plugin {
    @PluginMethod
    public void saveUrl(PluginCall call) {
        String url = call.getString("url", "");
        if (!url.startsWith("https://")) { call.reject("An HTTPS download URL is required."); return; }
        try {
            DownloadManager dm = (DownloadManager) getContext().getSystemService(Context.DOWNLOAD_SERVICE);
            DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
            request.setTitle("SliceVid clip");
            request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
            request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, "SliceVid-" + System.currentTimeMillis() + "." + safeExtension(call.getString("extension", "mp4")));
            dm.enqueue(request);
            call.resolve();
        } catch (Exception e) { call.reject("Could not start download", e); }
    }

    private String safeExtension(String extension) {
        return extension.matches("mp4|webm|mp3|srt|vtt") ? extension : "bin";
    }

    @PluginMethod
    public void saveSubtitle(PluginCall call) {
        Uri uri = null;
        try {
            byte[] bytes = Base64.decode(call.getString("base64", ""), Base64.DEFAULT);
            if (bytes.length == 0 || bytes.length > 5 * 1024 * 1024) { call.reject("Invalid subtitle size"); return; }
            ContentValues values = new ContentValues();
            values.put(MediaStore.Downloads.DISPLAY_NAME, "SliceVid-" + System.currentTimeMillis() + "." + safeExtension(call.getString("extension", "srt")));
            values.put(MediaStore.Downloads.MIME_TYPE, "text/plain");
            values.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);
            uri = getContext().getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
            if (uri == null) throw new Exception("Could not create file");
            try (OutputStream out = getContext().getContentResolver().openOutputStream(uri)) {
                if (out == null) throw new Exception("Could not open file");
                out.write(bytes);
            }
            call.resolve(new JSObject().put("saved", true));
        } catch (Exception e) {
            if (uri != null) getContext().getContentResolver().delete(uri, null, null);
            call.reject("Could not save subtitles", e);
        }
    }
}
