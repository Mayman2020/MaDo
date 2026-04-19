package com.mado.dto;

import lombok.Builder;

@Builder
public record ChatSettingsResponse(
        int slowModeSeconds,
        boolean followersOnlyMode,
        boolean subscribersOnlyMode,
        boolean emotesOnlyMode,
        int minAccountAgeDays
) {
}
