package com.mado.security;

import com.mado.exception.TooManyRequestsException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;

/** Caps account creation bursts per IP (Redis). */
@Component
@RequiredArgsConstructor
public class RegisterRateLimiter {

    private static final String KEY_PREFIX = "rl:register:";
    private static final int MAX_PER_WINDOW = 10;
    private static final Duration WINDOW = Duration.ofHours(1);

    private final StringRedisTemplate redis;

    public void assertAllowed(String clientIp) {
        try {
            String k = KEY_PREFIX + clientIp;
            Long c = redis.opsForValue().increment(k);
            if (c != null && c == 1L) {
                redis.expire(k, WINDOW);
            }
            if (c != null && c > MAX_PER_WINDOW) {
                throw new TooManyRequestsException("Too many registration attempts from this network. Try again later.");
            }
        } catch (TooManyRequestsException e) {
            throw e; // re-throw the real rate-limit error
        } catch (Exception ignored) {
            // Redis unavailable — fail open (allow the request)
        }
    }
}
