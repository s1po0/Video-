package com.slicevid.app;

import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Clips SRT/WebVTT cues to a source time range and rebases them to clip time. */
final class SubtitleTrimmer {
    private static final String TIME = "(?:(\\d+):)?(\\d{2}):(\\d{2})[.,](\\d{3})";
    private static final Pattern CUE = Pattern.compile("^\\s*" + TIME + "\\s+-->\\s+" + TIME + "(.*)$");
    private static final Pattern INLINE_VTT_TIME = Pattern.compile("<(?:(?:\\d+):)?\\d{2}:\\d{2}\\.\\d{3}>");

    private static long millis(Matcher m, int i) {
        long hours = m.group(i) == null ? 0 : Long.parseLong(m.group(i));
        long minutes = Long.parseLong(m.group(i + 1));
        long seconds = Long.parseLong(m.group(i + 2));
        long milliseconds = Long.parseLong(m.group(i + 3));
        if (minutes > 59 || seconds > 59) throw new IllegalArgumentException("Invalid subtitle timestamp");
        return (((hours * 60) + minutes) * 60 + seconds) * 1000 + milliseconds;
    }

    private static String timestamp(long time, boolean vtt) {
        long hours = time / 3600000;
        long minutes = time / 60000 % 60;
        long seconds = time / 1000 % 60;
        long ms = time % 1000;
        return String.format(Locale.US, "%02d:%02d:%02d%s%03d", hours, minutes, seconds, vtt ? "." : ",", ms);
    }

    static String trim(String input, String format, long startMs, long endMs) {
        if (!("vtt".equals(format) || "srt".equals(format)) || startMs < 0 || endMs <= startMs) throw new IllegalArgumentException("Invalid subtitle selection");
        boolean vtt = "vtt".equals(format);
        String normalized = input.replace("\r\n", "\n").replace('\r', '\n').replaceFirst("^\\uFEFF", "");
        String[] blocks = normalized.split("\\n[ \\t]*\\n+");
        StringBuilder output = new StringBuilder();
        if (vtt) {
            if (!normalized.startsWith("WEBVTT")) throw new IllegalArgumentException("Invalid WebVTT file");
            // Preserve header metadata except media timestamp maps: clip time is
            // already rebased to zero and the original map would shift it again.
            for (String line : blocks[0].split("\\n")) {
                if (!line.trim().startsWith("X-TIMESTAMP-MAP")) output.append(line).append('\n');
            }
            output.append('\n');
        }
        int count = 0;
        for (int n = vtt ? 1 : 0; n < blocks.length; n++) {
            String block = blocks[n].trim();
            if (block.isEmpty()) continue;
            if (vtt && (block.startsWith("NOTE") || block.startsWith("STYLE") || block.startsWith("REGION"))) {
                output.append(block).append("\n\n");
                continue;
            }
            String[] lines = block.split("\n", -1);
            int cueLine = -1;
            Matcher cue = null;
            for (int i = 0; i < Math.min(lines.length, 2); i++) {
                Matcher candidate = CUE.matcher(lines[i]);
                if (candidate.matches()) { cueLine = i; cue = candidate; break; }
            }
            if (cue == null || cueLine + 1 >= lines.length) continue;
            long from = millis(cue, 1), to = millis(cue, 5);
            long clippedStart = Math.max(from, startMs), clippedEnd = Math.min(to, endMs);
            if (clippedEnd <= clippedStart) continue;
            count++;
            if (vtt && cueLine == 1) output.append(lines[0]).append('\n');
            else if (!vtt) output.append(count).append('\n');
            output.append(timestamp(clippedStart - startMs, vtt)).append(" --> ")
                .append(timestamp(clippedEnd - startMs, vtt)).append(cue.group(9)).append('\n');
            for (int i = cueLine + 1; i < lines.length; i++) {
                // Inline karaoke timestamps are in original-video time. Remove
                // them rather than leave invalid/out-of-range times after cutting.
                output.append(vtt ? INLINE_VTT_TIME.matcher(lines[i]).replaceAll("") : lines[i]).append('\n');
            }
            output.append('\n');
        }
        if (count == 0) throw new IllegalArgumentException("لە بەشە هەڵبژێردراوەکەدا ژێرنووس نەدۆزرایەوە.");
        return output.toString();
    }

    private SubtitleTrimmer() { }
}
