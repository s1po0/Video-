package com.slicevid.app;

import org.json.JSONObject;
import java.net.ServerSocket;
import java.net.Socket;
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
        try (ServerSocket server = new ServerSocket(0)) {
            Thread responses = new Thread(() -> {
                try {
                    for (int i = 0; i < 2; i++) try (Socket socket = server.accept()) {
                        java.io.BufferedReader reader = new java.io.BufferedReader(new java.io.InputStreamReader(socket.getInputStream(), StandardCharsets.UTF_8));
                        String line;
                        while ((line = reader.readLine()) != null && !line.isEmpty()) { }
                        String response = i == 0
                            ? "HTTP/1.1 200 OK\r\nContent-Length: 13\r\nConnection: close\r\n\r\n{\"events\":[]}"
                            : "HTTP/1.1 302 Found\r\nLocation: /captions\r\nContent-Length: 0\r\nConnection: close\r\n\r\n";
                        socket.getOutputStream().write(response.getBytes(StandardCharsets.UTF_8));
                    }
                } catch (IOException e) { throw new RuntimeException(e); }
            });
            responses.start();
            String base = "http://127.0.0.1:" + server.getLocalPort();
            assertEquals("{\"events\":[]}", SubtitleTracks.fetch(base + "/captions", ""));
            try { SubtitleTracks.fetch(base + "/redirect", ""); fail(); }
            catch (IOException expected) { assertEquals("Subtitle HTTP 302", expected.getMessage()); }
            responses.join(5000);
            assertFalse(responses.isAlive());
        }
    }
    @Test public void onlyYoutubeCaptionEndpointsAreAllowed() {
        assertTrue(SubtitleTracks.safeUrl(MANUAL));
        for (String url : new String[]{"http://www.youtube.com/api/timedtext", "https://evil.youtube.com/api/timedtext", "https://www.youtube.com.evil.org/api/timedtext", "https://www.youtube.com/api/other", "https://www.youtube.com:8443/api/timedtext", "https://x@www.youtube.com/api/timedtext"}) assertFalse(url, SubtitleTracks.safeUrl(url));
    }
}
