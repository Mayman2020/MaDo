package com.mado.dto;

import lombok.Builder;

import java.util.UUID;

@Builder
public record ChannelPublicResponse(
        UUID id,
        String username,
        String title,
        String description,
        String thumbnailUrl,
        boolean isLive,
        int viewerCount,
        String categorySlug,
        String categoryName,
        String streamKey,
        String hlsMasterUrl,
        /** Active stream session id when live; used for analytics & deep links. */
        UUID currentStreamId,
        int followerCount,
        long totalViews
) {
}
