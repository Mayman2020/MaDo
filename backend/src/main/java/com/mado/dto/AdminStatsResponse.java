package com.mado.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AdminStatsResponse {
    private final long totalUsers;
    private final long liveStreams;
    private final long revenueCents;
}
