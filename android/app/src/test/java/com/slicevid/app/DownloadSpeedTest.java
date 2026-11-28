package com.slicevid.app;

import org.junit.Test;
import static org.junit.Assert.*;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class DownloadSpeedTest {
    @Test public void onlyFullMediaUsesParallelDownloader() {
        assertTrue(DownloadSpeed.useParallel("video", 0));
        assertFalse(DownloadSpeed.useParallel("video", 30));
        assertFalse(DownloadSpeed.useParallel("subtitle", 0));
    }
    @Test public void failureFallsBackAfterCleanup() throws Exception {
        List<String> calls = new ArrayList<>();
        DownloadSpeed.run(true, fast -> {
            calls.add(fast ? "parallel" : "native");
            if (fast) throw new Exception("ERROR: aria2c exited with code 3");
        }, () -> calls.add("notice"), () -> calls.add("clean"));
        assertEquals(Arrays.asList("parallel", "notice", "clean", "native"), calls);
    }
    @Test public void ordinaryErrorsAreNotRetried() {
        List<String> calls = new ArrayList<>();
        try {
            DownloadSpeed.run(true, fast -> { calls.add("attempt"); throw new Exception("disk full"); }, () -> calls.add("notice"), () -> calls.add("clean"));
            fail();
        } catch (Exception expected) { assertEquals("disk full", expected.getMessage()); }
        assertEquals(Arrays.asList("attempt"), calls);
    }
    @Test public void fallbackOnlyForDownloaderErrors() {
        assertTrue(DownloadSpeed.downloaderFailed(new Exception("ERROR: aria2c exited with code 3")));
        assertTrue(DownloadSpeed.downloaderFailed(new Exception("aria2c not available")));
        assertFalse(DownloadSpeed.downloaderFailed(new Exception("disk full")));
        assertFalse(DownloadSpeed.downloaderFailed(new Exception("HTTP Error 403")));
    }
}
