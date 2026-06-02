package com.mado.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class StreamHealthResponse {
    private final boolean publishing;
    private final String streamName;
    private final Integer bitrateKbps;
    private final Double fps;
    private final Long droppedFrames;
    private final Integer width;
    private final Integer height;
    private final Integer activeSubscribers;
    private final String rawMessage;
}
