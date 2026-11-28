package com.slicevid.app;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Interpret actual progress, not the wrapper's stale or unavailable percentage. */
final class DownloadProgress {
    private static final Pattern DOWNLOAD = Pattern.compile("\\[download\\]\\s+(\\d+(?:\\.\\d+)?)%");
    private static final Pattern ARIA = Pattern.compile("\\[#[A-Za-z0-9]{6}[^\\]]*?\\((\\d+(?:\\.\\d+)?)%\\)");
    private DownloadProgress() { }
    static int percent(String line, float wrapperProgress, int clipSeconds) {
        if (line == null) return -1;
        // ffmpeg's out_time_us and out_time_ms are both in microseconds.
        if (clipSeconds > 0 && (line.startsWith("out_time_us=") || line.startsWith("out_time_ms="))) {
            try {
                long micros = Long.parseLong(line.substring(line.indexOf('=') + 1).trim());
                if (micros < 0) return -1;
                return (int) Math.max(0, Math.min(99, 100.0 * micros / (clipSeconds * 1000000.0)));
            } catch (NumberFormatException ignored) { return -1; }
        }
        // Parse only real download lines. The wrapper reuses its previous value
        // for unrelated messages and treats any ffmpeg "size=" line as 99%.
        Matcher m = DOWNLOAD.matcher(line);
        if (m.find()) {
            try { return (int) Math.max(0, Math.min(99, Double.parseDouble(m.group(1)))); }
            catch (NumberFormatException ignored) { }
        }
        Matcher aria = ARIA.matcher(line);
        if (aria.find()) {
            try { return (int) Math.max(0, Math.min(99, Double.parseDouble(aria.group(1)))); }
            catch (NumberFormatException ignored) { }
        }
        return -1;
    }
}
