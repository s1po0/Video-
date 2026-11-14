package com.videoupscaler.app;

import android.net.Uri;

/**
 * Shared, process-wide state of the current upscaling job.
 *
 * <p>The job itself lives in {@link UpscaleService}, which keeps running when the
 * user leaves the app. The activity only observes this holder, so coming back to
 * the app always shows the live state — even after the activity was destroyed.
 */
final class JobState {

    private JobState() { }

    /** True while a job is being processed. */
    static volatile boolean running = false;
    /** 0..1 */
    static volatile float fraction = 0f;
    /** Short line such as "1234 frames · 3840×2160". */
    static volatile String detail = "";
    /** Localised status line shown in the UI. */
    static volatile String status = "";
    /** Milliseconds left, or -1. */
    static volatile long etaMs = -1;
    /** Human readable remaining-time label, or "". */
    static volatile String etaLabel = "";

    static volatile String fileName = "";
    static volatile int outWidth = 0;
    static volatile int outHeight = 0;
    static volatile String resultMessage = "";
    /** True when the user cancelled instead of failing. */
    static volatile boolean cancelled = false;
    static volatile String error = "";

    static volatile Uri publishedUri = null;
    static volatile String outputPath = null;

    /** Timestamp of the last state change, used to detect a finished job. */
    static volatile long finishedAt = 0;
    static volatile long startedAt = 0;

    static void reset() {
        running = false;
        fraction = 0f;
        detail = "";
        status = "";
        etaMs = -1;
        etaLabel = "";
        outWidth = 0;
        outHeight = 0;
        resultMessage = "";
        error = "";
        cancelled = false;
        publishedUri = null;
        outputPath = null;
        finishedAt = 0;
        startedAt = 0;
    }
}
