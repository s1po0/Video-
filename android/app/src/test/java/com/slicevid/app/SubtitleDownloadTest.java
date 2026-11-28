package com.slicevid.app;

import org.junit.Test;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import static org.junit.Assert.*;

public class SubtitleDownloadTest {
    @Test public void retriesOnlyWhenManualHasNoCuesAndAutomaticExists() throws Exception {
        List<String> calls = new ArrayList<>();
        String output = SubtitleDownload.run(true, automatic -> {
            calls.add(automatic ? "automatic" : "manual");
            if (!automatic) throw new SubtitleTrimmer.NoCuesException("no cues");
            return "matched";
        }, () -> calls.add("notice"), () -> calls.add("clean"));
        assertEquals("matched", output);
        assertEquals(Arrays.asList("manual", "notice", "clean", "automatic"), calls);
    }
    @Test public void doesNotRetryMissingAutoOrUnrelatedErrors() throws Exception {
        for (boolean automaticAvailable : new boolean[]{false, true}) {
            List<String> calls = new ArrayList<>();
            try {
                SubtitleDownload.run(automaticAvailable, automatic -> {
                    calls.add("attempt");
                    if (automaticAvailable) throw new Exception("disk full");
                    throw new SubtitleTrimmer.NoCuesException("no cues");
                }, () -> calls.add("notice"), () -> calls.add("clean"));
                fail();
            } catch (Exception expected) { assertEquals(Arrays.asList("attempt"), calls); }
        }
    }
    @Test public void secondNoCuesIsReportedRatherThanLooping() throws Exception {
        List<String> calls = new ArrayList<>();
        try {
            SubtitleDownload.run(true, automatic -> {
                calls.add(automatic ? "automatic" : "manual");
                throw new SubtitleTrimmer.NoCuesException(automatic ? "auto empty" : "manual empty");
            }, () -> calls.add("notice"), () -> calls.add("clean"));
            fail();
        } catch (SubtitleTrimmer.NoCuesException expected) { assertEquals("auto empty", expected.getMessage()); }
        assertEquals(Arrays.asList("manual", "notice", "clean", "automatic"), calls);
    }
}
