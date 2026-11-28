package com.slicevid.app;

import org.junit.Test;
import static org.junit.Assert.*;

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
}
