package com.slicevid.app;

final class SubtitleDownload {
    interface Attempt<T> { T run(String language, boolean automaticOnly) throws Exception; }
    interface Action { void run() throws Exception; }
    static final class Result<T> {
        final T value;
        final String language;
        Result(T value, String language) { this.value = value; this.language = language; }
    }

    static <T> Result<T> run(String language, boolean automaticAvailable, String[] manual, String[] automatic,
                              Attempt<T> attempt, Runnable notice, Action clean) throws Exception {
        SubtitleTrimmer.NoCuesException missing;
        try { return new Result<>(attempt.run(language, false), language); }
        catch (SubtitleTrimmer.NoCuesException error) { missing = error; }
        if (automaticAvailable) {
            notice.run(); clean.run();
            try { return new Result<>(attempt.run(language, true), language); }
            catch (SubtitleTrimmer.NoCuesException error) { missing = error; }
        }
        if (manual != null) for (String alternative : manual) {
            if (alternative == null || alternative.equals(language)) continue;
            notice.run(); clean.run();
            try { return new Result<>(attempt.run(alternative, false), alternative); }
            catch (SubtitleTrimmer.NoCuesException error) { missing = error; }
        }
        if (automatic != null) for (String alternative : automatic) {
            if (alternative == null || alternative.equals(language)) continue;
            notice.run(); clean.run();
            try { return new Result<>(attempt.run(alternative, true), alternative); }
            catch (SubtitleTrimmer.NoCuesException error) { missing = error; }
        }
        throw missing;
    }
    private SubtitleDownload() { }
}
