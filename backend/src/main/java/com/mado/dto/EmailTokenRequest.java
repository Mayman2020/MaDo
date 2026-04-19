package com.mado.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class EmailTokenRequest {
    @NotBlank
    private String token;
}
