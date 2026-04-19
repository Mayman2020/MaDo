package com.mado.dto;

import lombok.Builder;

import java.time.Instant;
import java.util.UUID;

@Builder
public record ChatMessageResponse(
        UUID id,
        String username,
        String displayName,
        String content,
        Instant createdAt,
        String color
) {
}
