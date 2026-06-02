package com.mado.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ClipFromHlsRequest {
    @NotBlank
    private String channelUsername;

    @NotBlank
    @Size(max = 140)
    private String title;
}
