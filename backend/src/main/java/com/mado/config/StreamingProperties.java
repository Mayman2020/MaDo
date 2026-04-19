package com.mado.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.streaming")
public class StreamingProperties {

    /**
     * Public base URL for HLS master playlists (nginx http server, no trailing slash).
     */
    private String hlsBaseUrl = "http://localhost:8088/hls";
}
