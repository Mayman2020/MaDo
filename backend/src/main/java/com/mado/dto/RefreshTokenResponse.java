package com.mado.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
@AllArgsConstructor
public class RefreshTokenResponse {
    private String accessToken;
    private String refreshToken;
    private UserResponse user;
}
