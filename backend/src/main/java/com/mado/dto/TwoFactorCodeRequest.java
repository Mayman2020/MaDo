package com.mado.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TwoFactorCodeRequest {
    @NotBlank
    private String code;
}
