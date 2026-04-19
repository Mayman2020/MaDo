package com.mado.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class ClipCreateRequest {

    @NotNull
    private UUID streamId;

    @NotBlank
    @Size(max = 140)
    private String title;

    @NotBlank
    @Size(max = 500)
    private String clipUrl;

    private String thumbnailUrl;
}
