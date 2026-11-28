package com.slicevid.app;

import org.json.JSONObject;
import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.TemporaryFolder;
import static org.junit.Assert.*;

public class SubtitleTracksTest {
    @Rule public TemporaryFolder temp = new TemporaryFolder();
    private static final String MANUAL = "https://www.youtube.com/api/timedtext?v=abcdefghijk&fmt=json3&lang=ar";
    private static final String AUTO = "https://www.youtube.com/api/timedtext?v=abcdefghijk&fmt=json3&lang=ar&kind=asr";
    @Test public void reusesTheSelectedTrackWithoutVideoExtraction() throws Exception {
        JSONObject info = new JSONObject("{\"http_headers\":{\"User-Agent\":\"Example\"},\"subtitles\":{\"ar\":[{\"ext\":\"json3\",\"url\":\"" + MANUAL + "\"}]},\"automatic_captions\":{\"ar\":[{\"ext\":\"json3\",\"url\":\"" + AUTO + "\"}]}}");
        SubtitleTracks.save(temp.getRoot(), "https://youtu.be/abcdefghijk", info);
        SubtitleTracks.Fetcher capture = (url, agent) -> url + "|" + agent;
        assertEquals(MANUAL + "|Example", SubtitleTracks.load(temp.getRoot(), "https://youtu.be/abcdefghijk", "ar", false, capture));
        assertEquals(AUTO + "|Example", SubtitleTracks.load(temp.getRoot(), "https://youtu.be/abcdefghijk", "ar", true, capture));
        assertNull(SubtitleTracks.load(temp.getRoot(), "https://youtu.be/other", "ar", false, capture));
        assertNull(SubtitleTracks.load(temp.getRoot(), "https://youtu.be/abcdefghijk", "fr", false, capture));
    }
    @Test public void directHttpReadsCaptionAndRejectsRedirect() throws Exception {
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/captions", exchange -> {
            byte[] body = "{\"events\":[]}".getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(200, body.length);
            exchange.getResponseBody().write(body);
            exchange.close();
        });
        server.createContext("/redirect", exchange -> {
            exchange.getResponseHeaders().add("Location", "/captions");
            exchange.sendResponseHeaders(302, -1);
            exchange.close();
        });
        server.start();
        try {
            String base = "http://127.0.0.1:" + server.getAddress().getPort();
            assertEquals("{\"events\":[]}", SubtitleTracks.fetch(base + "/captions", ""));
            try { SubtitleTracks.fetch(base + "/redirect", ""); fail(); }
            catch (IOException expected) { assertEquals("Subtitle HTTP 302", expected.getMessage()); }
        } finally { server.stop(0); }
    }
    @Test public void onlyYoutubeCaptionEndpointsAreAllowed() {
        assertTrue(SubtitleTracks.safeUrl(MANUAL));
        for (String url : new String[]{"http://www.youtube.com/api/timedtext", "https://evil.youtube.com/api/timedtext", "https://www.youtube.com.evil.org/api/timedtext", "https://www.youtube.com/api/other", "https://www.youtube.com:8443/api/timedtext", "https://x@www.youtube.com/api/timedtext"}) assertFalse(url, SubtitleTracks.safeUrl(url));
    }
}
