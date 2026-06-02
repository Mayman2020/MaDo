package com.mado.service;

import com.mado.config.StreamingProperties;
import com.mado.entity.Channel;
import com.mado.entity.Stream;
import com.mado.entity.Vod;
import com.mado.event.StreamEndedEvent;
import com.mado.repository.StreamRepository;
import com.mado.repository.VodRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class VodProcessingService {

    private final StreamRepository streamRepository;
    private final VodRepository vodRepository;
    private final S3MediaUploadService s3MediaUploadService;
    private final StreamingProperties streamingProperties;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Async
    public void onStreamEnded(StreamEndedEvent event) {
        processStream(event.streamId());
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void processStream(UUID streamId) {
        Stream stream = streamRepository.findByIdWithChannelAndUser(streamId).orElse(null);
        if (stream == null) {
            return;
        }
        if (vodRepository.existsByStream_Id(streamId)) {
            return;
        }
        Channel ch = stream.getChannel();
        if (ch == null || ch.getStreamKey() == null) {
            return;
        }
        String hls = streamingProperties.getHlsBaseUrl() + "/" + ch.getStreamKey() + "/index.m3u8";
        Path tmp;
        try {
            tmp = Files.createTempFile("vod-" + streamId, ".mp4");
        } catch (Exception e) {
            log.warn("VOD temp file: {}", e.getMessage());
            return;
        }
        try {
            ProcessBuilder pb = new ProcessBuilder(
                    streamingProperties.getFfmpegPath(),
                    "-y",
                    "-loglevel", "error",
                    "-allowed_extensions", "ALL",
                    "-i", hls,
                    "-c", "copy",
                    "-movflags", "+faststart",
                    tmp.toAbsolutePath().toString()
            );
            pb.redirectError(ProcessBuilder.Redirect.DISCARD);
            pb.redirectOutput(ProcessBuilder.Redirect.DISCARD);
            Process p = pb.start();
            boolean finished = p.waitFor(20, java.util.concurrent.TimeUnit.MINUTES);
            if (!finished || p.exitValue() != 0) {
                log.warn("FFmpeg VOD failed for stream {} (exit={})", streamId, finished ? p.exitValue() : "timeout");
                return;
            }
            if (!Files.exists(tmp) || Files.size(tmp) < 1024) {
                log.warn("VOD output too small for stream {}", streamId);
                return;
            }
            String key = "vods/" + ch.getUser().getUsername() + "/" + streamId + ".mp4";
            String url = s3MediaUploadService.uploadFile(key, tmp, "video/mp4");

            long dur = Duration.between(stream.getStartedAt(), stream.getEndedAt() != null ? stream.getEndedAt() : Instant.now()).getSeconds();
            int durSec = dur > Integer.MAX_VALUE ? Integer.MAX_VALUE : (int) dur;
            Vod vod = Vod.builder()
                    .stream(stream)
                    .channel(ch)
                    .title(stream.getTitle() != null ? stream.getTitle() : "Past broadcast")
                    .vodUrl(url)
                    .thumbnailUrl(ch.getThumbnailUrl())
                    .durationSeconds(durSec)
                    .isPublic(true)
                    .build();
            vodRepository.save(vod);
            stream.setVodUrl(url);
            streamRepository.save(stream);
        } catch (Exception e) {
            log.warn("VOD processing error for {}: {}", streamId, e.getMessage());
        } finally {
            try {
                Files.deleteIfExists(tmp);
            } catch (Exception ignored) {
            }
        }
    }
}
