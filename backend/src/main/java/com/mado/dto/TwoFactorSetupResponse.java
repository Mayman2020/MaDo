package com.mado.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class TwoFactorSetupResponse {
    private final String secret;
    private final String otpauthUrl;
}
