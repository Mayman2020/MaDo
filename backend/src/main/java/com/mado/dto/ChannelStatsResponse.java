package com.mado.dto;

import lombok.Builder;

@Builder
public record ChannelStatsResponse(
        long followerCount,
        long subscriberCount,
        long totalViews,
        int peakViewerCount
) {
}
