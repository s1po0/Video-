package com.slicevid.app;

import org.junit.Test;
import static org.junit.Assert.assertEquals;

public class DownloadProgressTest {
    @Test public void unknownIsNotZero() {
        assertEquals(-1, DownloadProgress.percent("[youtube] Extracting URL", -1, 0));
        assertEquals(-1, DownloadProgress.percent("size=123kB", 99, 0));
    }
    @Test public void actualDownloadPercentage() {
        assertEquals(42, DownloadProgress.percent("[download]  42.3% of 50MiB", -1, 0));
        assertEquals(99, DownloadProgress.percent("[download] 100% of 50MiB", 100, 0));
    }
    @Test public void ffmpegClipTime() {
        assertEquals(50, DownloadProgress.percent("out_time_us=15000000", -1, 30));
        assertEquals(50, DownloadProgress.percent("out_time_ms=15000000", -1, 30));
        assertEquals(99, DownloadProgress.percent("out_time_us=32000000", -1, 30));
        assertEquals(-1, DownloadProgress.percent("out_time_us=N/A", -1, 30));
        assertEquals(-1, DownloadProgress.percent("out_time_us=1000000", -1, 0));
    }
}
