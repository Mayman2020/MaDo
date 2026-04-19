package com.mado.dto;

import lombok.Builder;

import java.util.List;

@Builder
public record SearchResponse(
        List<ChannelPublicResponse> channels,
        List<ClipResponse> clips,
        List<CategoryResponse> categories
) {
}
