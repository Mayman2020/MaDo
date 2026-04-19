package com.mado.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ChatSettingsRequest {

    @Min(0) @Max(120)
    private Integer slowModeSeconds;

    private Boolean followersOnlyMode;

    private Boolean subscribersOnlyMode;

    private Boolean emotesOnlyMode;

    @Min(0) @Max(365)
    private Integer minAccountAgeDays;
}
