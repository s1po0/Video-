package com.slicevid.app;

import static org.junit.Assert.*;
import org.junit.Test;

public class SubtitleTrimmerTest {
    @Test public void srtClipsOverlappingCuesAndRebasesToZero() {
        String srt = "1\r\n00:00:09,500 --> 00:00:11,200\r\nFirst\r\n\r\n" +
                     "2\r\n00:00:15,000 --> 00:00:25,000\r\nSecond\r\n\r\n" +
                     "3\r\n00:00:22,000 --> 00:00:23,000\r\nOutside\r\n";
        String result = SubtitleTrimmer.trim(srt, "srt", 10000, 20000);
        assertTrue(result.contains("1\n00:00:00,000 --> 00:00:01,200\nFirst"));
        assertTrue(result.contains("2\n00:00:05,000 --> 00:00:10,000\nSecond"));
        assertFalse(result.contains("Outside"));
    }

    @Test public void vttPreservesCueSettingsAndRemovesOldInlineTimes() {
        String vtt = "\uFEFFWEBVTT\nX-TIMESTAMP-MAP=LOCAL:00:00:00.000,MPEGTS:0\n\n" +
            "STYLE\n::cue { color: lime; }\n\n" +
            "cue-1\n00:00:09.500 --> 00:00:12.500 align:start position:10%\nHello <00:00:10.500><c>world</c>\n\n";
        String result = SubtitleTrimmer.trim(vtt, "vtt", 10000, 12000);
        assertTrue(result.startsWith("WEBVTT\n\nSTYLE\n"));
        assertTrue(result.contains("cue-1\n00:00:00.000 --> 00:00:02.000 align:start position:10%"));
        assertTrue(result.contains("Hello <c>world</c>"));
        assertFalse(result.contains("X-TIMESTAMP-MAP"));
        assertFalse(result.contains("<00:00:10.500>"));
    }

    @Test public void timeBeyondAnHourAndBoundaryCues() {
        String vtt = "WEBVTT\n\n01:01:00.000 --> 01:01:02.000\nHello\n\n" +
            "01:01:02.000 --> 01:01:03.000\nBoundary\n";
        String result = SubtitleTrimmer.trim(vtt, "vtt", 3661000, 3662000);
        assertTrue(result.contains("00:00:00.000 --> 00:00:01.000\nHello"));
        assertFalse(result.contains("Boundary"));
    }

    @Test public void webvttShortTimesAndSrtNumbering() {
        String vtt = "WEBVTT\n\n00:07.200 --> 00:09.000\nHi\n";
        assertTrue(SubtitleTrimmer.trim(vtt, "vtt", 8000, 10000).contains("00:00:00.000 --> 00:00:01.000\nHi"));
        String srt = "5\n00:00:07,200 --> 00:00:09,000\nHi\n";
        assertTrue(SubtitleTrimmer.trim(srt, "srt", 8000, 10000).startsWith("1\n00:00:00,000 --> 00:00:01,000"));
    }

    @Test(expected = IllegalArgumentException.class) public void noCuesDoesNotProduceMisleadingEmptyFile() {
        SubtitleTrimmer.trim("1\n00:00:01,000 --> 00:00:02,000\nHello\n", "srt", 5000, 6000);
    }
}
