package com.mado.util;

import org.jsoup.Jsoup;
import org.jsoup.safety.Safelist;

/**
 * Strips HTML and control characters from user-controlled text before persistence or display.
 */
public final class TextSanitizer {

    private TextSanitizer() {
    }

    public static String plainText(String input, int maxLength) {
        if (input == null) {
            return "";
        }
        String noHtml = Jsoup.clean(input, Safelist.none());
        String normalized = noHtml.replace('\0', ' ').trim();
        if (normalized.length() > maxLength) {
            return normalized.substring(0, maxLength);
        }
        return normalized;
    }

    /** Chat lines: single-line, no newlines, max 500 (matches {@link com.mado.dto.ChatSendRequest}). */
    public static String chatMessage(String input) {
        if (input == null) {
            return "";
        }
        String oneLine = input.replace('\r', ' ').replace('\n', ' ').replace('\t', ' ');
        return plainText(oneLine, 500);
    }
}
