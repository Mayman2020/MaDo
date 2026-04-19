package com.mado.dto.moderation;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class BanRequest {

    @NotBlank
    private String targetUsername;

    private String reason;

    private boolean permanent;

    /** Timeout minutes if not permanent */
    private Integer timeoutMinutes;
}
