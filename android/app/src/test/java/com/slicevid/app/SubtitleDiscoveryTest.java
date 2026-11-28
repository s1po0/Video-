package com.slicevid.app;

import org.junit.Test;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import static org.junit.Assert.*;

public class SubtitleDiscoveryTest {
    @Test public void ignoresLiveChatAndSpecialSelections() {
        assertFalse(SubtitleDiscovery.isCaptionLanguage("live_chat"));
        assertFalse(SubtitleDiscovery.isCaptionLanguage("all"));
        assertFalse(SubtitleDiscovery.isCaptionLanguage("-en"));
        assertTrue(SubtitleDiscovery.isCaptionLanguage("ar"));
        assertTrue(SubtitleDiscovery.isCaptionLanguage("zh-Hans-orig"));
    }
    @Test public void availableTracksDoNotCauseExtraLookups() {
        List<String> calls = new ArrayList<>();
        SubtitleDiscovery.Result<String> r = SubtitleDiscovery.find("en", alt -> { calls.add("lookup"); return "ku"; },
            s -> !s.isEmpty(), () -> { calls.add("update"); return true; });
        assertEquals("en", r.value); assertFalse(r.alternate); assertTrue(calls.isEmpty());
    }
    @Test public void alternateClientIsRetainedForDownloading() {
        List<String> calls = new ArrayList<>();
        SubtitleDiscovery.Result<String> r = SubtitleDiscovery.find("", alt -> { calls.add("alternate"); return "en"; },
            s -> !s.isEmpty(), () -> { calls.add("update"); return true; });
        assertEquals("en", r.value); assertTrue(r.alternate); assertEquals(Arrays.asList("alternate"), calls);
    }
    @Test public void missingCaptionsRetryAfterUpdate() {
        List<String> calls = new ArrayList<>();
        SubtitleDiscovery.Result<String> r = SubtitleDiscovery.find("", alt -> {
            calls.add(alt ? "alternate" : "default"); return calls.size() == 3 ? "ku" : "";
        }, s -> !s.isEmpty(), () -> { calls.add("update"); return true; });
        assertEquals("ku", r.value); assertFalse(r.alternate);
        assertEquals(Arrays.asList("alternate", "update", "default"), calls);
    }
    @Test public void failedFallbackDoesNotLoseVideoMetadata() {
        SubtitleDiscovery.Result<String> r = SubtitleDiscovery.find("", alt -> { throw new Exception(); },
            s -> !s.isEmpty(), () -> { throw new Exception(); });
        assertEquals("", r.value); assertFalse(r.alternate);
    }
}
