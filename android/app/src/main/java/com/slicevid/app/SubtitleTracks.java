package com.slicevid.app;

import org.json.JSONArray;
import org.json.JSONObject;
import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.net.URL;
import java.net.HttpURLConnection;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.Iterator;

final class SubtitleTracks {
    private static final int LIMIT = 30 * 1024 * 1024;

    static void save(File cache, String video, JSONObject info) throws Exception {
        JSONObject entry = new JSONObject();
        entry.put("video", video);
        for (String kind : new String[]{"subtitles", "automatic_captions"}) {
            JSONObject source = info.optJSONObject(kind), tracks = new JSONObject();
            if (source != null) {
                Iterator<String> it = source.keys();
                while (it.hasNext()) {
                    String lang = it.next();
                    if (!SubtitleDiscovery.isCaptionLanguage(lang)) continue;
                    JSONArray formats = source.optJSONArray(lang);
                    if (formats == null) continue;
                    for (int i = 0; i < formats.length(); i++) {
                        JSONObject item = formats.optJSONObject(i);
                        if (item == null || !"json3".equals(item.optString("ext"))) continue;
                        String url = item.optString("url");
                        if (safeUrl(url)) tracks.put(lang, url);
                    }
                }
            }
            entry.put(kind, tracks);
        }
        JSONObject headers = info.optJSONObject("http_headers");
        String agent = headers == null ? "" : headers.optString("User-Agent", "");
        if (agent.length() <= 512 && !agent.contains("\n") && !agent.contains("\r")) entry.put("agent", agent);
        File temp = new File(cache, "caption-tracks.tmp");
        Files.write(temp.toPath(), entry.toString().getBytes(StandardCharsets.UTF_8));
        Files.move(temp.toPath(), new File(cache, "caption-tracks.json").toPath(), StandardCopyOption.REPLACE_EXISTING);
    }

    interface Fetcher { String get(String url, String agent) throws IOException; }

    static String load(File cache, String video, String language, boolean automaticOnly) throws Exception {
        return load(cache, video, language, automaticOnly, SubtitleTracks::fetch);
    }

    static String load(File cache, String video, String language, boolean automaticOnly, Fetcher fetcher) throws Exception {
        File file = new File(cache, "caption-tracks.json");
        if (!file.isFile() || file.length() > 8 * 1024 * 1024) return null;
        JSONObject entry = new JSONObject(new String(Files.readAllBytes(file.toPath()), StandardCharsets.UTF_8));
        if (!video.equals(entry.optString("video"))) return null;
        JSONObject manual = entry.optJSONObject("subtitles"), auto = entry.optJSONObject("automatic_captions");
        String url = !automaticOnly && manual != null ? manual.optString(language, "") : "";
        if (url.isEmpty() && auto != null) url = auto.optString(language, "");
        if (!safeUrl(url)) return null;
        return fetcher.get(url, entry.optString("agent", ""));
    }

    static boolean safeUrl(String value) {
        try {
            URL url = new URL(value);
            String host = url.getHost();
            return value.length() <= 8192 && "https".equalsIgnoreCase(url.getProtocol()) && url.getUserInfo() == null &&
                (url.getPort() == -1 || url.getPort() == 443) &&
                (host.equalsIgnoreCase("www.youtube.com") || host.equalsIgnoreCase("youtube.com") || host.equalsIgnoreCase("m.youtube.com")) &&
                "/api/timedtext".equals(url.getPath());
        } catch (Exception e) { return false; }
    }

    static String fetch(String address, String agent) throws IOException {
        HttpURLConnection conn = (HttpURLConnection) new URL(address).openConnection();
        conn.setInstanceFollowRedirects(false);
        conn.setConnectTimeout(15000); conn.setReadTimeout(30000);
        if (!agent.isEmpty()) conn.setRequestProperty("User-Agent", agent);
        try {
            int status = conn.getResponseCode();
            if (status != 200) throw new IOException("Subtitle HTTP " + status);
            if (conn.getContentLengthLong() > LIMIT) throw new IOException("Subtitle is too large");
            try (InputStream in = conn.getInputStream(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
                byte[] bytes = new byte[16384]; int n;
                while ((n = in.read(bytes)) != -1) {
                    if (out.size() + n > LIMIT) throw new IOException("Subtitle is too large");
                    out.write(bytes, 0, n);
                }
                return out.toString("UTF-8");
            }
        } finally { conn.disconnect(); }
    }
    private SubtitleTracks() { }
}
