package com.slicevid.app;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

final class DownloadFailure {
    private static final Pattern FORBIDDEN = Pattern.compile("(?i)\\b(?:http(?:\\s+error)?\\s*:?\\s*403|server returned 403|403\\s+forbidden)\\b");
    private static final Pattern DETAILS = Pattern.compile("(?i)(error|failed|invalid|no space|permission denied|broken pipe|cannot|unable|timed out|connection reset|not found)");
    private static final Pattern GENERIC = Pattern.compile("(?i)^(?:conversion failed!?|error:\\s*ffmpeg exited with code.*)$");
    private DownloadFailure() { }
    static boolean isForbidden(Throwable error) {
        for (Throwable e = error; e != null; e = e.getCause()) {
            if (e.getMessage() != null && FORBIDDEN.matcher(e.getMessage()).find()) return true;
            if (e.getCause() == e) break;
        }
        return false;
    }
    static String userMessage(Throwable error) {
        if (isForbidden(error)) return "یوتوب ڕێگەی دابەزاندنی ئەم ڤیدیۆیەی نەدا (403)، تکایە دووبارە هەوڵ بدەوە. ڤیدیۆیەکی تر تاقی بکەوە یان دواتر دووبارە هەوڵ بدەوە.";
        String msg = error.getMessage();
        if (msg == null || msg.trim().isEmpty()) return "دابەزاندن سەرکەوتوو نەبوو؛ تکایە دووبارە هەوڵ بدەوە.";
        // Do not expose signed stream URLs, local paths, or IP addresses in the UI.
        msg = msg.replaceAll("(?i)https?://[^\\s'\\\"]+", "[link]")
                 .replaceAll("\\b(?:[0-9]{1,3}\\.){3}[0-9]{1,3}\\b", "[IP]")
                 .replaceAll("(?i)\\b(?:token|signature|sig|key|password|cookie|authorization)=([^\\s&]+)", "[private]")
                 .replaceAll("/(?:data|storage|sdcard)/[^\\s'\\\"]+", "[file]");
        String[] lines = msg.split("[\\r\\n]+");
        List<String> relevant = new ArrayList<>();
        for (String line : lines) {
            line = line.trim();
            if (DETAILS.matcher(line).find() && !GENERIC.matcher(line).matches()) relevant.add(line);
        }
        if (!relevant.isEmpty()) {
            int from = Math.max(0, relevant.size() - 2);
            msg = String.join(" • ", relevant.subList(from, relevant.size()));
        } else if (lines.length > 1) {
            msg = lines[lines.length - 1].trim();
        } else msg = msg.trim();
        if (msg.length() > 350) msg = "…" + msg.substring(msg.length() - 349);
        return msg;
    }
}
