package com.slicevid.app;

final class SubtitleDiscovery {
    interface Lookup<T> { T get(boolean alternate) throws Exception; }
    interface HasTracks<T> { boolean test(T value); }
    interface Update { boolean run() throws Exception; }

    static final class Result<T> {
        final T value;
        final boolean alternate;
        Result(T value, boolean alternate) { this.value = value; this.alternate = alternate; }
    }

    static <T> Result<T> find(T initial, Lookup<T> lookup, HasTracks<T> hasTracks, Update update) {
        if (hasTracks.test(initial)) return new Result<>(initial, false);
        try {
            T alternate = lookup.get(true);
            if (hasTracks.test(alternate)) return new Result<>(alternate, true);
        } catch (Exception ignored) { }
        try {
            if (update.run()) {
                T current = lookup.get(false);
                if (hasTracks.test(current)) return new Result<>(current, false);
                T alternate = lookup.get(true);
                if (hasTracks.test(alternate)) return new Result<>(alternate, true);
            }
        } catch (Exception ignored) { }
        return new Result<>(initial, false);
    }
    static boolean isCaptionLanguage(String code) {
        return code != null && !code.equalsIgnoreCase("live_chat") && code.matches("[A-Za-z0-9][A-Za-z0-9_-]{0,34}") && !code.equalsIgnoreCase("all");
    }
    private SubtitleDiscovery() { }
}
