package com.mado.security;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.UUID;

/**
 * At most one chat message per second per user per channel (Redis SET NX).
 */
@Component
@RequiredArgsConstructor
public class ChatRateLimiter {

    private static final String KEY_PREFIX = "rl:chat:";
    private static final Duration WINDOW = Duration.ofSeconds(1);

    private final StringRedisTemplate redis;

    public boolean tryAcquire(UUID channelId, UUID userId) {
        String key = KEY_PREFIX + channelId + ":" + userId;
        Boolean ok = redis.opsForValue().setIfAbsent(key, "1", WINDOW);
        return Boolean.TRUE.equals(ok);
    }
}
