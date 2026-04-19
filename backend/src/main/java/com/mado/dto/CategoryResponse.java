package com.mado.dto;

import lombok.Builder;

import java.util.UUID;

@Builder
public record CategoryResponse(
        UUID id,
        String name,
        String slug,
        String thumbnailUrl,
        int viewerCount
) {
}
