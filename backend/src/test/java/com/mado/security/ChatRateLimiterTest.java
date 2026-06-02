package com.mado.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.time.Duration;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ChatRateLimiterTest {

    @Mock StringRedisTemplate     redis;
    @Mock ValueOperations<String, String> valueOps;

    private ChatRateLimiter rateLimiter;

    private final UUID channelId = UUID.randomUUID();
    private final UUID userId1   = UUID.randomUUID();
    private final UUID userId2   = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        when(redis.opsForValue()).thenReturn(valueOps);
        rateLimiter = new ChatRateLimiter(redis);
    }

    @Test
    void tryAcquire_firstMessage_returnsTrue() {
        when(valueOps.setIfAbsent(anyString(), eq("1"), any(Duration.class))).thenReturn(true);

        assertThat(rateLimiter.tryAcquire(channelId, userId1)).isTrue();
    }

    @Test
    void tryAcquire_secondMessageWithinWindow_returnsFalse() {
        // Key already exists (previous message set it)
        when(valueOps.setIfAbsent(anyString(), eq("1"), any(Duration.class))).thenReturn(false);

        assertThat(rateLimiter.tryAcquire(channelId, userId1)).isFalse();
    }

    @Test
    void tryAcquire_differentUsers_separateKeys() {
        String keyUser1 = "rl:chat:" + channelId + ":" + userId1;
        String keyUser2 = "rl:chat:" + channelId + ":" + userId2;

        when(valueOps.setIfAbsent(eq(keyUser1), eq("1"), any(Duration.class))).thenReturn(false);
        when(valueOps.setIfAbsent(eq(keyUser2), eq("1"), any(Duration.class))).thenReturn(true);

        assertThat(rateLimiter.tryAcquire(channelId, userId1)).isFalse();
        assertThat(rateLimiter.tryAcquire(channelId, userId2)).isTrue();
    }

    @Test
    void tryAcquire_differentChannels_separateKeys() {
        UUID channel1 = UUID.randomUUID();
        UUID channel2 = UUID.randomUUID();

        String key1 = "rl:chat:" + channel1 + ":" + userId1;
        String key2 = "rl:chat:" + channel2 + ":" + userId1;

        when(valueOps.setIfAbsent(eq(key1), eq("1"), any(Duration.class))).thenReturn(false);
        when(valueOps.setIfAbsent(eq(key2), eq("1"), any(Duration.class))).thenReturn(true);

        assertThat(rateLimiter.tryAcquire(channel1, userId1)).isFalse();
        assertThat(rateLimiter.tryAcquire(channel2, userId1)).isTrue();
    }

    @Test
    void tryAcquire_redisReturnsNull_returnsFalse() {
        // Redis returning null (e.g. connection glitch) should default to throttled for safety
        when(valueOps.setIfAbsent(anyString(), eq("1"), any(Duration.class))).thenReturn(null);

        assertThat(rateLimiter.tryAcquire(channelId, userId1)).isFalse();
    }

    @Test
    void tryAcquire_usesOneSecondWindow() {
        rateLimiter.tryAcquire(channelId, userId1);

        verify(valueOps).setIfAbsent(anyString(), eq("1"), eq(Duration.ofSeconds(1)));
    }
}
