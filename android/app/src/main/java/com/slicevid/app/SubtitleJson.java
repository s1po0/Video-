package com.slicevid.app;

import org.json.JSONArray;
import org.json.JSONObject;
import java.util.Locale;

final class SubtitleJson {
    static String convert(String input, String format, long start, long end) throws Exception {
        if ((!format.equals("srt") && !format.equals("vtt")) || start < 0 || (end != 0 && end <= start)) throw new IllegalArgumentException("Invalid subtitle selection");
        JSONObject data = new JSONObject(input);
        JSONArray events = data.optJSONArray("events");
        if (events == null) throw new IllegalArgumentException("Invalid caption data");
        boolean vtt = format.equals("vtt");
        StringBuilder result = new StringBuilder(vtt ? "WEBVTT\n\n" : "");
        int count = 0, parsed = 0;
        for (int i = 0; i < events.length(); i++) {
            JSONObject event = events.optJSONObject(i);
            if (event == null) continue;
            JSONArray segs = event.optJSONArray("segs");
            if (segs == null || segs.length() == 0) continue;
            StringBuilder text = new StringBuilder();
            for (int j = 0; j < segs.length(); j++) {
                JSONObject seg = segs.optJSONObject(j);
                if (seg != null) text.append(seg.optString("utf8", ""));
            }
            String line = text.toString().replace("\r", "").trim();
            if (line.isEmpty()) continue;
            Object timestamp = event.opt("tStartMs"), duration = event.opt("dDurationMs");
            if (!(timestamp instanceof Number) || !(duration instanceof Number) || event.optInt("aAppend", 0) != 0) throw new IllegalArgumentException("Unsupported caption timing");
            long from = ((Number) timestamp).longValue(), length = ((Number) duration).longValue();
            if (from < 0 || length <= 0 || from > Long.MAX_VALUE - length) throw new IllegalArgumentException("Unsupported caption timing");
            parsed++;
            long to = from + length;
            long clipStart = Math.max(start, from), clipEnd = end == 0 ? to : Math.min(end, to);
            if (clipEnd <= clipStart) continue;
            count++;
            if (!vtt) result.append(count).append('\n');
            result.append(stamp(clipStart - start, vtt)).append(" --> ").append(stamp(clipEnd - start, vtt)).append('\n');
            result.append(line.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replaceAll("\\n[ \\t]*\\n+", "\n"));
            result.append("\n\n");
        }
        if (parsed == 0) throw new IllegalArgumentException("Empty caption data");
        if (count == 0) throw new SubtitleTrimmer.NoCuesException("لە بەشە هەڵبژێردراوەکەدا ژێرنووس نەدۆزرایەوە.");
        return result.toString();
    }

    private static String stamp(long ms, boolean vtt) {
        return String.format(Locale.US, "%02d:%02d:%02d%s%03d", ms / 3600000, ms / 60000 % 60, ms / 1000 % 60, vtt ? "." : ",", ms % 1000);
    }
    private SubtitleJson() { }
}
