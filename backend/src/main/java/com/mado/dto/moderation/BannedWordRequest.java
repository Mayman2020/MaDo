package com.mado.dto.moderation;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class BannedWordRequest {

    @NotBlank
    @Size(max = 100)
    private String word;
}
