package com.slicevid.app;

import org.junit.Test;
import static org.junit.Assert.*;

public class SubtitleJsonTest {
    private static final String JSON = "{\"events\":[" +
        "{\"tStartMs\":79282000,\"dDurationMs\":2000,\"segs\":[{\"utf8\":\"before & start\"}]} ," +
        "{\"tStartMs\":79293000,\"dDurationMs\":1800,\"segs\":[{\"utf8\":\"مرحبا \"},{\"utf8\":\"<friend>\"}]} ," +
        "{\"tStartMs\":81187500,\"dDurationMs\":2000,\"segs\":[{\"utf8\":\"end\"}]} ," +
        "{\"tStartMs\":81189000,\"dDurationMs\":1000,\"segs\":[{\"utf8\":\"outside\"}]}]}";
    @Test public void clipsAndRebasesAcrossTwentyTwoHours() throws Exception {
        String srt = SubtitleJson.convert(JSON, "srt", 79283000, 81188000);
        assertEquals("1\n00:00:00,000 --> 00:00:01,000\nbefore &amp; start\n\n" +
            "2\n00:00:10,000 --> 00:00:11,800\nمرحبا &lt;friend&gt;\n\n" +
            "3\n00:31:44,500 --> 00:31:45,000\nend\n\n", srt);
        String vtt = SubtitleJson.convert(JSON, "vtt", 79283000, 81188000);
        assertTrue(vtt.startsWith("WEBVTT\n\n00:00:00.000 --> 00:00:01.000"));
        assertFalse(vtt.contains("outside"));
    }
    @Test public void fullTrackRetainsAbsoluteTimes() throws Exception {
        String srt = SubtitleJson.convert(JSON, "srt", 0, 0);
        assertTrue(srt.contains("22:01:22,000 --> 22:01:24,000"));
        assertTrue(srt.contains("outside"));
    }
    @Test public void noMatchingCueDoesNotInventText() throws Exception {
        try { SubtitleJson.convert(JSON, "srt", 90000000, 90001000); fail(); }
        catch (SubtitleTrimmer.NoCuesException expected) { }
    }
    @Test public void malformedOrAmbiguousTimingUsesFallback() throws Exception {
        for (String json : new String[]{"{}", "{\"events\":[]}",
            "{\"events\":[{\"tStartMs\":0,\"segs\":[{\"utf8\":\"x\"}]}]}",
            "{\"events\":[{\"tStartMs\":0,\"dDurationMs\":100,\"aAppend\":1,\"segs\":[{\"utf8\":\"x\"}]}]}"}) {
            try { SubtitleJson.convert(json, "srt", 0, 0); fail(json); }
            catch (SubtitleTrimmer.NoCuesException wrong) { fail("must use legacy fallback"); }
            catch (IllegalArgumentException expected) { }
        }
    }
}
