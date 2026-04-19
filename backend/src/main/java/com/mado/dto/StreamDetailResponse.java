package com.mado.dto;

import lombok.Builder;

import java.time.Instant;
import java.util.UUID;

@Builder
public record StreamDetailResponse(
        UUID id,
        UUID channelId,
        String channelUsername,
        String title,
        Instant startedAt,
        Instant endedAt,
        Integer peakViewers,
        String vodUrl
) {
}
