package com.slicevid.app;

import org.junit.Test;
import static org.junit.Assert.*;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class DownloadRetryTest {
    private Exception forbidden() { return new Exception("HTTP error 403 Forbidden opening input https://example.test/file?ip=1.2.3.4&token=secret"); }
    @Test public void forbiddenIsRecognizedAndRedacted() {
        Exception e = forbidden();
        assertTrue(DownloadFailure.isForbidden(e));
        assertTrue(DownloadFailure.isForbidden(new Exception("wrapped", e)));
        assertFalse(DownloadFailure.isForbidden(new Exception("403 items found")));
        assertFalse(DownloadFailure.userMessage(e).contains("secret"));
        assertFalse(DownloadFailure.userMessage(new Exception("error https://site.test/?token=secret ip=1.2.3.4")).contains("1.2.3.4"));
        assertFalse(DownloadFailure.userMessage(new Exception("error https://site.test/?token=secret")).contains("secret"));
    }
    @Test public void retryUpdateThenAlternateWithCleanSlate() throws Exception {
        List<String> calls = new ArrayList<>();
        DownloadRetry.run(alt -> { calls.add(alt ? "alternate" : "default"); if (!alt) throw forbidden(); },
            () -> { calls.add("update"); throw new Exception("network"); },
            () -> calls.add("clean"), () -> calls.add("notice"));
        assertEquals(Arrays.asList("default", "update", "clean", "default", "notice", "clean", "alternate"), calls);
    }
    @Test public void otherErrorsAreNotRetried() {
        List<String> calls = new ArrayList<>();
        try {
            DownloadRetry.run(alt -> { calls.add("attempt"); throw new Exception("disk full"); }, () -> calls.add("update"), () -> calls.add("clean"), () -> calls.add("notice"));
            fail("Expected failure");
        } catch (Exception expected) { assertEquals("disk full", expected.getMessage()); }
        assertEquals(Arrays.asList("attempt"), calls);
    }
    @Test public void successfulFirstAttemptDoesNotRetry() throws Exception {
        List<String> calls = new ArrayList<>();
        DownloadRetry.run(alt -> calls.add("attempt"), () -> calls.add("update"), () -> calls.add("clean"), () -> calls.add("notice"));
        assertEquals(Arrays.asList("attempt"), calls);
    }
}
