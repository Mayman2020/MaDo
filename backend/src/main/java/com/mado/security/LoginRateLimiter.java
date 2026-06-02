package com.mado.security;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;

/**
 * Limits failed login attempts per client IP (Redis-backed for multi-instance).
 */
@Component
@RequiredArgsConstructor
public class LoginRateLimiter {

    private static final String KEY_PREFIX = "rl:login:";
    private static final int MAX_ATTEMPTS = 5;
    private static final Duration WINDOW = Duration.ofMinutes(15);

    private final StringRedisTemplate redis;

    public void assertAllowed(String clientIp) {
        try {
            String k = KEY_PREFIX + clientIp;
            String v = redis.opsForValue().get(k);
            if (v != null) {
                try {
                    if (Integer.parseInt(v) >= MAX_ATTEMPTS) {
                        throw new com.mado.exception.TooManyRequestsException(
                                "Too many failed login attempts. Try again in a few minutes.");
                    }
                } catch (NumberFormatException ignored) {
                    redis.delete(k);
                }
            }
        } catch (com.mado.exception.TooManyRequestsException e) {
            throw e;
        } catch (Exception ignored) {}
    }

    public void recordFailure(String clientIp) {
        try {
            String k = KEY_PREFIX + clientIp;
            Long c = redis.opsForValue().increment(k);
            if (c != null && c == 1L) {
                redis.expire(k, WINDOW);
            }
        } catch (Exception ignored) {}
    }

    public void clear(String clientIp) {
        try { redis.delete(KEY_PREFIX + clientIp); } catch (Exception ignored) {}
    }
}
