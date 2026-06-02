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

    /**
     * nginx-rtmp HTTP stat page (XML), e.g. http://localhost:8088/stat
     */
    private String rtmpStatUrl = "http://127.0.0.1:8088/stat";

    /** ffmpeg executable (on PATH or absolute). */
    private String ffmpegPath = "ffmpeg";

    /** Public site URL for email links (no trailing slash). */
    private String publicWebUrl = "http://localhost:4200";

    /**
     * When non-blank, nginx-rtmp HTTP callbacks must send header {@code X-Mado-Stream-Callback} with this exact value.
     */
    private String callbackSecret = "";
}
