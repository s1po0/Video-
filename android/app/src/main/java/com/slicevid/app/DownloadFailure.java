package com.slicevid.app;

import java.util.regex.Pattern;

final class DownloadFailure {
    private static final Pattern FORBIDDEN = Pattern.compile("(?i)\\b(?:http(?:\\s+error)?\\s*:?\\s*403|server returned 403|403\\s+forbidden)\\b");
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
        // Stream URLs contain signed tokens and IP addresses: never show them.
        msg = msg.replaceAll("(?i)https?://\\S+", "[link]")
                 .replaceAll("\\b(?:[0-9]{1,3}\\.){3}[0-9]{1,3}\\b", "[IP]").trim();
        if (msg.length() > 350) msg = msg.substring(0, 350);
        return msg;
    }
}
