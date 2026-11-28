package com.slicevid.app;

import org.junit.Test;
import static org.junit.Assert.*;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.nio.file.Files;
import java.nio.charset.StandardCharsets;
import java.io.File;

public class ClipDownloadTest {
    @Test public void boundedRequestsOnlyForMp4Clips() {
        assertTrue(ClipDownload.useBoundedRequests("video", "mp4", 42));
        assertFalse(ClipDownload.useBoundedRequests("video", "mp4", 0));
        assertFalse(ClipDownload.useBoundedRequests("video", "webm", 42));
        assertFalse(ClipDownload.useBoundedRequests("video", "mp3", 42));
        assertFalse(ClipDownload.useBoundedRequests("subtitle", "mp4", 42));
    }
    @Test public void truncatedTracksAreRejected() {
        assertTrue(ClipDownload.durationTooShort(50_000_000L, 60));
        assertFalse(ClipDownload.durationTooShort(59_000_000L, 60));
        assertFalse(ClipDownload.durationTooShort(0, 60));
        assertFalse(ClipDownload.durationTooShort(10_000_000L, 0));
        assertTrue(ClipDownload.durationTooShort(0L + 2_000_000_000L, 3600));
    }
    @Test public void retriesKnownOldYtdlpFailureWithLegacyFfmpeg() throws Exception {
        List<String> calls = new ArrayList<>();
        ClipDownload.run(true, bounded -> {
            calls.add(bounded ? "bounded" : "legacy");
            if (bounded) throw new Exception("ERROR: 'NoneType' object has no attribute 'decode'");
        }, () -> calls.add("notice"), () -> calls.add("clean"));
        assertEquals(Arrays.asList("bounded", "notice", "clean", "legacy"), calls);
    }
    @Test public void otherFailuresDoNotRestart() throws Exception {
        List<String> calls = new ArrayList<>();
        try {
            ClipDownload.run(true, bounded -> { calls.add("attempt"); throw new Exception("disk full"); },
                () -> calls.add("notice"), () -> calls.add("clean"));
            fail();
        } catch (Exception expected) { assertEquals("disk full", expected.getMessage()); }
        assertEquals(Arrays.asList("attempt"), calls);
    }
    @Test public void unusableExecutableIsDetected() throws Exception {
        File dir = Files.createTempDirectory("clip-test").toFile();
        File good = new File(dir, "good");
        File bad = new File(dir, "bad");
        try {
            Files.write(good.toPath(), "#!/bin/sh\necho ffmpeg version 9.0\n".getBytes(StandardCharsets.UTF_8));
            Files.write(bad.toPath(), "#!/bin/sh\necho failure\nexit 127\n".getBytes(StandardCharsets.UTF_8));
            assertTrue(good.setExecutable(true)); assertTrue(bad.setExecutable(true));
            assertTrue(ClipDownload.isUsable(good, dir));
            assertFalse(ClipDownload.isUsable(bad, dir));
            assertFalse(ClipDownload.isUsable(new File(dir, "missing"), dir));
        } finally { good.delete(); bad.delete(); dir.delete(); }
    }
}
