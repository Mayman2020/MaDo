package com.mado.scheduler;

import com.mado.repository.RefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;

@Slf4j
@Component
@RequiredArgsConstructor
public class RefreshTokenCleanupScheduler {

    private final RefreshTokenRepository refreshTokenRepository;

    @Scheduled(cron = "0 0 * * * *")
    public void cleanupExpiredTokens() {
        refreshTokenRepository.deleteByExpiresAtBefore(Instant.now());
        log.debug("Expired refresh tokens cleanup completed");
    }
}
