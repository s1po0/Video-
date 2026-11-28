package com.slicevid.app;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.TimeUnit;

final class ClipDownload {
    static final String INPUT_ARGS = "ffmpeg_i:-request_size 2097152 -initial_request_size 262144 -short_seek_size 2097152 -multiple_requests 1";
    static final String PREVIOUS_INPUT_ARGS = "ffmpeg_i:-request_size 8388608 -short_seek_size 8388608 -multiple_requests 1";
    enum Mode { OPTIMIZED, PREVIOUS, LEGACY }
    interface Attempt { void run(Mode mode) throws Exception; }
    static final class IncompleteClipException extends Exception {
        IncompleteClipException(String track, long actualUs, int expectedSeconds) {
            super("ماوەی " + track + " تەواو نییە: " + (actualUs / 1_000_000L) + " چرکە لە " + expectedSeconds + " چرکە. دەتوانیت دووبارە هەوڵ بدەیت.");
        }
    }
    interface Action { void run() throws Exception; }
    private ClipDownload() { }

    static boolean useBoundedRequests(String kind, String format, int end) {
        return "video".equals(kind) && "mp4".equals(format) && end > 0;
    }

    static boolean isUsable(File ffmpeg, File noBackupDir) {
        Process process = null;
        try {
            if (!ffmpeg.isFile()) return false;
            File packages = new File(noBackupDir, "youtubedl-android/packages");
            ProcessBuilder builder = new ProcessBuilder(ffmpeg.getAbsolutePath(), "-version");
            builder.redirectErrorStream(true);
            builder.environment().put("LD_LIBRARY_PATH", new File(packages, "python/usr/lib").getAbsolutePath() + ":"
                    + new File(packages, "ffmpeg/usr/lib").getAbsolutePath() + ":"
                    + new File(packages, "aria2c/usr/lib").getAbsolutePath());
            process = builder.start();
            if (!process.waitFor(15, TimeUnit.SECONDS)) return false;
            ByteArrayOutputStream data = new ByteArrayOutputStream();
            try (InputStream in = process.getInputStream()) {
                byte[] buffer = new byte[4096];
                int n;
                while ((n = in.read(buffer)) != -1 && data.size() < 65536) data.write(buffer, 0, n);
            }
            return process.exitValue() == 0 && new String(data.toByteArray(), StandardCharsets.UTF_8).contains("ffmpeg version");
        } catch (Exception error) {
            if (error instanceof InterruptedException) Thread.currentThread().interrupt();
            return false;
        } finally {
            if (process != null) process.destroyForcibly();
        }
    }

    static void run(boolean bounded, Attempt attempt, Runnable notice, Action clean) throws Exception {
        Mode mode = bounded ? Mode.OPTIMIZED : Mode.LEGACY;
        while (true) {
            try { attempt.run(mode); return; }
            catch (Exception error) {
                Mode next;
                if (mode == Mode.OPTIMIZED && error instanceof IncompleteClipException) {
                    next = Mode.PREVIOUS;
                } else if (mode != Mode.LEGACY && !DownloadFailure.isForbidden(error)
                        && error.getMessage() != null
                        && error.getMessage().contains("'NoneType' object has no attribute 'decode'")) {
                    next = Mode.LEGACY;
                } else throw error;
                notice.run();
                clean.run();
                mode = next;
            }
        }
    }

    static boolean durationTooShort(long actualUs, int expectedSeconds) {
        if (actualUs <= 0 || expectedSeconds <= 0) return false;
        long expectedUs = expectedSeconds * 1_000_000L;
        long allowance = Math.max(2_000_000L, expectedUs / 50);
        return actualUs + allowance < expectedUs;
    }
}
