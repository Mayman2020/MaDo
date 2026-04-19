package com.mado.dto;

import lombok.Builder;

import java.util.UUID;

@Builder
public record LiveStreamResponse(
        UUID channelId,
        String username,
        String title,
        String thumbnailUrl,
        int viewerCount,
        String categorySlug,
        UUID streamId,
        String hlsMasterUrl
) {
}
