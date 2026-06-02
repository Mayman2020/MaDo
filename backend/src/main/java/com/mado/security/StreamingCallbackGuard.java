package com.mado.security;

import com.mado.config.StreamingProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

/**
 * Optional shared secret for nginx-rtmp HTTP callbacks ({@code on_publish}, etc.).
 * When {@code app.streaming.callback-secret} is blank, checks are skipped (local dev).
 */
@Component
@RequiredArgsConstructor
public class StreamingCallbackGuard {

    private final StreamingProperties streamingProperties;

    public void assertAuthorized(String headerValue) {
        String expected = streamingProperties.getCallbackSecret();
        if (expected == null || expected.isBlank()) {
            return;
        }
        if (headerValue == null || !expected.equals(headerValue.trim())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Invalid stream callback authorization");
        }
    }
}
