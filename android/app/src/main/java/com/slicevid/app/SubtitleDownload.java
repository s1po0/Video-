package com.slicevid.app;

final class SubtitleDownload {
    interface Attempt<T> { T run(String language, boolean automaticOnly) throws Exception; }
    interface Action { void run() throws Exception; }
    static final class Result<T> {
        final T value;
        final String language;
        Result(T value, String language) { this.value = value; this.language = language; }
    }

    static <T> Result<T> run(String language, boolean automaticAvailable, String[] originals,
                              Attempt<T> attempt, Runnable notice, Action clean) throws Exception {
        SubtitleTrimmer.NoCuesException missing;
        try { return new Result<>(attempt.run(language, false), language); }
        catch (SubtitleTrimmer.NoCuesException error) { missing = error; }
        if (automaticAvailable) {
            notice.run(); clean.run();
            try { return new Result<>(attempt.run(language, true), language); }
            catch (SubtitleTrimmer.NoCuesException error) { missing = error; }
        }
        if (originals != null) for (String original : originals) {
            if (original == null || original.equals(language)) continue;
            notice.run(); clean.run();
            try { return new Result<>(attempt.run(original, true), original); }
            catch (SubtitleTrimmer.NoCuesException error) { missing = error; }
        }
        throw missing;
    }
    private SubtitleDownload() { }
}
