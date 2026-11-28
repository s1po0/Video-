package com.slicevid.app;

final class ClipDownload {
    static final String INPUT_ARGS = "ffmpeg_i:-request_size 8388608 -short_seek_size 8388608";
    private ClipDownload() { }
    static boolean useBoundedRequests(String kind, String format, int end) {
        return "video".equals(kind) && "mp4".equals(format) && end > 0;
    }
    static boolean durationTooShort(long actualUs, int expectedSeconds) {
        if (actualUs <= 0 || expectedSeconds <= 0) return false;
        long expectedUs = expectedSeconds * 1_000_000L;
        long allowance = Math.max(2_000_000L, expectedUs / 50);
        return actualUs + allowance < expectedUs;
    }
}
