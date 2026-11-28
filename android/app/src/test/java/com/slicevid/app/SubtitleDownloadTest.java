package com.slicevid.app;

import org.junit.Test;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import static org.junit.Assert.*;

public class SubtitleDownloadTest {
    @Test public void retriesSameLanguageAutoThenOriginal() throws Exception {
        List<String> calls = new ArrayList<>();
        SubtitleDownload.Result<String> result = SubtitleDownload.run("ar", true, new String[]{"en-orig"}, (language, automatic) -> {
            calls.add(language + ":" + automatic);
            if (!language.equals("en-orig")) throw new SubtitleTrimmer.NoCuesException("no cues");
            return "matched";
        }, () -> calls.add("notice"), () -> calls.add("clean"));
        assertEquals("matched", result.value);
        assertEquals("en-orig", result.language);
        assertEquals(Arrays.asList("ar:false", "notice", "clean", "ar:true", "notice", "clean", "en-orig:true"), calls);
    }
    @Test public void retriesOriginalWhenSelectedTrackIsAlreadyAutomatic() throws Exception {
        List<String> calls = new ArrayList<>();
        SubtitleDownload.Result<String> result = SubtitleDownload.run("ar", false, new String[]{"ar", "en-orig"}, (lang, auto) -> {
            calls.add(lang);
            if (lang.equals("ar")) throw new SubtitleTrimmer.NoCuesException("no cues");
            return "matched";
        }, () -> calls.add("notice"), () -> calls.add("clean"));
        assertEquals("en-orig", result.language);
        assertEquals(Arrays.asList("ar", "notice", "clean", "en-orig"), calls);
    }
    @Test public void doesNotRetryUnrelatedErrors() throws Exception {
        List<String> calls = new ArrayList<>();
        try {
            SubtitleDownload.run("ar", true, new String[]{"en-orig"}, (lang, automatic) -> {
                calls.add("attempt"); throw new Exception("disk full");
            }, () -> calls.add("notice"), () -> calls.add("clean"));
            fail();
        } catch (Exception expected) { assertEquals(Arrays.asList("attempt"), calls); }
    }
    @Test public void noMatchingTrackReportsLastNoCuesWithoutLoop() throws Exception {
        List<String> calls = new ArrayList<>();
        try {
            SubtitleDownload.run("ar", true, new String[]{"en-orig"}, (language, automatic) -> {
                calls.add(language + ":" + automatic);
                throw new SubtitleTrimmer.NoCuesException(language);
            }, () -> calls.add("notice"), () -> calls.add("clean"));
            fail();
        } catch (SubtitleTrimmer.NoCuesException expected) { assertEquals("en-orig", expected.getMessage()); }
        assertEquals(Arrays.asList("ar:false", "notice", "clean", "ar:true", "notice", "clean", "en-orig:true"), calls);
    }
    @Test public void fullOrMatchingTrackDoesNotRetry() throws Exception {
        List<String> calls = new ArrayList<>();
        SubtitleDownload.Result<String> result = SubtitleDownload.run("ar", false, null, (lang, auto) -> {
            calls.add(lang); return "ok";
        }, () -> calls.add("notice"), () -> calls.add("clean"));
        assertEquals("ar", result.language);
        assertEquals(Arrays.asList("ar"), calls);
    }
}
