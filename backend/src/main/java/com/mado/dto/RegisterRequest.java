package com.mado.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RegisterRequest {
    @NotBlank
    @Size(min = 3, max = 30)
    private String username;

    @Email
    @NotBlank
    private String email;

    @NotBlank
    @Size(min = 8, max = 100)
    private String password;

    @Size(max = 50)
    private String displayName;
}
