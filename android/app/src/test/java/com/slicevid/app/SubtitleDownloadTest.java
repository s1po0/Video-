package com.slicevid.app;

import org.junit.Test;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import static org.junit.Assert.*;

public class SubtitleDownloadTest {
    @Test public void retriesSelectedAutoThenOtherManual() throws Exception {
        List<String> calls = new ArrayList<>();
        SubtitleDownload.Result<String> result = SubtitleDownload.run("ar", true, new String[]{"en"}, new String[]{"zh-orig"}, (language, automatic) -> {
            calls.add(language + ":" + automatic);
            if (!language.equals("en")) throw new SubtitleTrimmer.NoCuesException("no cues");
            return "matched";
        }, () -> calls.add("notice"), () -> calls.add("clean"));
        assertEquals("matched", result.value);
        assertEquals("en", result.language);
        assertEquals(Arrays.asList("ar:false", "notice", "clean", "ar:true", "notice", "clean", "en:false"), calls);
    }
    @Test public void retriesOriginalAutomaticAfterManualTracks() throws Exception {
        List<String> calls = new ArrayList<>();
        SubtitleDownload.Result<String> result = SubtitleDownload.run("ar", false, new String[]{"ar", "en"}, new String[]{"zh-orig"}, (lang, auto) -> {
            calls.add(lang + ":" + auto);
            if (!lang.equals("zh-orig")) throw new SubtitleTrimmer.NoCuesException("no cues");
            return "matched";
        }, () -> calls.add("notice"), () -> calls.add("clean"));
        assertEquals("zh-orig", result.language);
        assertEquals(Arrays.asList("ar:false", "notice", "clean", "en:false", "notice", "clean", "zh-orig:true"), calls);
    }
    @Test public void otherManualTrackIsTrimmedToRequestedLongClip() throws Exception {
        long start = (22 * 3600L + 83) * 1000;
        long end = (22 * 3600L + 33 * 60 + 8) * 1000;
        SubtitleDownload.Result<String> result = SubtitleDownload.run("ar", false, new String[]{"en"}, null, (lang, auto) -> {
            String body = lang.equals("ar")
                ? "1\n21:32:40,000 --> 21:32:42,300\nold\n\n"
                : "1\n22:02:03,000 --> 22:02:05,000\nmatching\n\n";
            return SubtitleTrimmer.trim(body, "srt", start, end);
        }, () -> {}, () -> {});
        assertEquals("en", result.language);
        assertEquals("1\n00:00:40,000 --> 00:00:42,000\nmatching\n\n", result.value);
    }
    @Test public void doesNotRetryUnrelatedErrors() throws Exception {
        List<String> calls = new ArrayList<>();
        try {
            SubtitleDownload.run("ar", true, new String[]{"en"}, new String[]{"zh-orig"}, (lang, automatic) -> {
                calls.add("attempt"); throw new Exception("disk full");
            }, () -> calls.add("notice"), () -> calls.add("clean"));
            fail();
        } catch (Exception expected) { assertEquals(Arrays.asList("attempt"), calls); }
    }
    @Test public void noMatchingTrackReportsLastNoCuesWithoutLoop() throws Exception {
        List<String> calls = new ArrayList<>();
        try {
            SubtitleDownload.run("ar", true, new String[]{"en"}, new String[]{"zh-orig"}, (language, automatic) -> {
                calls.add(language + ":" + automatic);
                throw new SubtitleTrimmer.NoCuesException(language);
            }, () -> calls.add("notice"), () -> calls.add("clean"));
            fail();
        } catch (SubtitleTrimmer.NoCuesException expected) { assertEquals("zh-orig", expected.getMessage()); }
        assertEquals(Arrays.asList("ar:false", "notice", "clean", "ar:true", "notice", "clean", "en:false", "notice", "clean", "zh-orig:true"), calls);
    }
    @Test public void fullOrMatchingTrackDoesNotRetry() throws Exception {
        List<String> calls = new ArrayList<>();
        SubtitleDownload.Result<String> result = SubtitleDownload.run("ar", false, null, null, (lang, auto) -> {
            calls.add(lang); return "ok";
        }, () -> calls.add("notice"), () -> calls.add("clean"));
        assertEquals("ar", result.language);
        assertEquals(Arrays.asList("ar"), calls);
    }
}
