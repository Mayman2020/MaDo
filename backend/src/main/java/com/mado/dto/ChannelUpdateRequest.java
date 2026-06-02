package com.mado.dto;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ChannelUpdateRequest {

    @Size(max = 140)
    private String title;

    @Size(max = 8000)
    private String description;

    private String categorySlug;
}
