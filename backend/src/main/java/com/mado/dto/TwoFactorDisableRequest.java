package com.mado.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TwoFactorDisableRequest {
    @NotBlank
    private String password;

    @NotBlank
    private String code;
}
