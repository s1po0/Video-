package com.slicevid.app;

import java.util.Locale;

final class DownloadSpeed {
    interface Attempt { void run(boolean parallel) throws Exception; }
    interface Action { void run() throws Exception; }
    private DownloadSpeed() { }
    static void run(boolean parallel, Attempt attempt, Runnable notice, Action clean) throws Exception {
        try { attempt.run(parallel); }
        catch (Exception error) {
            if (!parallel || !downloaderFailed(error)) throw error;
            notice.run();
            clean.run();
            attempt.run(false);
        }
    }
    static boolean useParallel(String kind, int end) {
        return "video".equals(kind) && end == 0;
    }
    static boolean downloaderFailed(Exception error) {
        String message = error.getMessage();
        if (message == null) return false;
        String lower = message.toLowerCase(Locale.ROOT);
        return lower.contains("aria2c exited with code") ||
               (lower.contains("aria2c") && (lower.contains("not available") || lower.contains("not found")));
    }
}
