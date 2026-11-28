package com.slicevid.app;

/** Retry only an explicit HTTP 403; each attempt must use fresh stream URLs. */
final class DownloadRetry {
    interface Attempt { void run(boolean alternate) throws Exception; }
    interface Action { void run() throws Exception; }
    private DownloadRetry() { }
    static void run(Attempt attempt, Action update, Action clean, Runnable alternateNotice) throws Exception {
        try { attempt.run(false); return; }
        catch (Exception first) {
            if (!DownloadFailure.isForbidden(first)) throw first;
        }
        // Network/update failure should not prevent a fresh extraction.
        try { update.run(); } catch (Exception ignored) { }
        clean.run();
        try { attempt.run(false); return; }
        catch (Exception second) {
            if (!DownloadFailure.isForbidden(second)) throw second;
            alternateNotice.run();
            clean.run();
            try { attempt.run(true); }
            catch (Exception third) {
                // If the alternate client has no compatible stream, the original
                // 403 remains the useful reason why this download couldn't finish.
                String msg = third.getMessage();
                if (DownloadFailure.isForbidden(third) || (msg != null && msg.contains("Requested format is not available"))) throw second;
                throw third;
            }
        }
    }
}
