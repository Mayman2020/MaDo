package com.mado.dto;

import lombok.Builder;

import java.time.Instant;
import java.util.UUID;

@Builder
public record ClipResponse(
        UUID id,
        UUID channelId,
        String channelUsername,
        String title,
        String clipUrl,
        String thumbnailUrl,
        long viewCount,
        Instant createdAt
) {
}
