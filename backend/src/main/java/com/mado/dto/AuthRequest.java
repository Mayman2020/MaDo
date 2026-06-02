package com.mado.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AuthRequest {
    @NotBlank
    private String identifier; // email OR username

    @NotBlank
    private String password;

    /** Required when the account has 2FA enabled. */
    private String totpCode;
}
