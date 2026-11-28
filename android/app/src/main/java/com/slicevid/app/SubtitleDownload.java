package com.slicevid.app;

final class SubtitleDownload {
    interface Attempt<T> { T run(boolean automaticOnly) throws Exception; }
    interface Action { void run() throws Exception; }

    static <T> T run(boolean automaticAvailable, Attempt<T> attempt, Runnable notice, Action clean) throws Exception {
        try { return attempt.run(false); }
        catch (SubtitleTrimmer.NoCuesException noCues) {
            if (!automaticAvailable) throw noCues;
            notice.run();
            clean.run();
            return attempt.run(true);
        }
    }
    private SubtitleDownload() { }
}
