package com.mado.service;

import com.mado.config.StreamingProperties;
import com.mado.dto.ClipCreateRequest;
import com.mado.dto.ClipFromHlsRequest;
import com.mado.dto.ClipResponse;
import com.mado.entity.Channel;
import com.mado.entity.Clip;
import com.mado.entity.Stream;
import com.mado.entity.User;
import com.mado.exception.BadRequestException;
import com.mado.exception.NotFoundException;
import com.mado.repository.ChannelRepository;
import com.mado.repository.ClipRepository;
import com.mado.repository.StreamRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class ClipService {

    private final ClipRepository clipRepository;
    private final StreamRepository streamRepository;
    private final ChannelRepository channelRepository;
    private final StreamingProperties streamingProperties;
    private final S3MediaUploadService s3MediaUploadService;

    @Transactional(readOnly = true)
    public Page<ClipResponse> list(Pageable pageable) {
        return clipRepository.findByOrderByCreatedAtDesc(pageable).map(this::toDto);
    }

    @Transactional(readOnly = true)
    public ClipResponse get(UUID id) {
        return clipRepository.findById(id)
                .map(this::toDto)
                .orElseThrow(() -> new NotFoundException("Clip not found"));
    }

    /**
     * Records the last ~30s of the channel's public HLS playlist as an MP4, uploads to object storage, and saves a clip row.
     */
    @Transactional
    public ClipResponse createFromLiveHls(ClipFromHlsRequest req, User creator) {
        String username = req.getChannelUsername().trim();
        Channel ch = channelRepository.findByUserUsername(username)
                .orElseThrow(() -> new NotFoundException("Channel not found"));
        if (!Boolean.TRUE.equals(ch.getIsLive())) {
            throw new BadRequestException("Channel is not live");
        }
        if (ch.getStreamKey() == null || ch.getStreamKey().isBlank()) {
            throw new BadRequestException("No stream key");
        }
        String hlsBase = streamingProperties.getHlsBaseUrl().replaceAll("/$", "");
        String hlsUrl = hlsBase + "/" + ch.getStreamKey() + "/index.m3u8";
        Path tmp;
        try {
            tmp = Files.createTempFile("clip-" + creator.getId(), ".mp4");
        } catch (Exception e) {
            log.warn("clip temp: {}", e.getMessage());
            throw new BadRequestException("Could not prepare clip file");
        }
        try {
            ProcessBuilder pb = new ProcessBuilder(
                    streamingProperties.getFfmpegPath(),
                    "-y",
                    "-loglevel", "error",
                    "-allowed_extensions", "ALL",
                    "-live_start_index", "-1",
                    "-i", hlsUrl,
                    "-t", "30",
                    "-c:v", "libx264",
                    "-preset", "veryfast",
                    "-crf", "23",
                    "-c:a", "aac",
                    "-b:a", "128k",
                    "-movflags", "+faststart",
                    tmp.toAbsolutePath().toString()
            );
            pb.redirectError(ProcessBuilder.Redirect.DISCARD);
            pb.redirectOutput(ProcessBuilder.Redirect.DISCARD);
            Process p = pb.start();
            boolean ok = p.waitFor(3, TimeUnit.MINUTES) && p.exitValue() == 0;
            if (!ok || !Files.exists(tmp) || Files.size(tmp) < 2048) {
                throw new BadRequestException("Could not extract clip from HLS");
            }
            String key = "clips/" + creator.getUsername() + "/" + UUID.randomUUID() + ".mp4";
            String url = s3MediaUploadService.uploadFile(key, tmp, "video/mp4");
            Stream stream = streamRepository.findFirstByChannelIdAndEndedAtIsNullOrderByStartedAtDesc(ch.getId()).orElse(null);
            Clip clip = Clip.builder()
                    .stream(stream)
                    .channel(ch)
                    .creator(creator)
                    .title(req.getTitle().trim())
                    .clipUrl(url)
                    .thumbnailUrl(ch.getThumbnailUrl())
                    .durationSeconds(30)
                    .build();
            clip = clipRepository.save(clip);
            return toDto(clip);
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.warn("clip ffmpeg: {}", e.getMessage());
            throw new BadRequestException("Could not create clip");
        } finally {
            try {
                if (tmp != null) {
                    Files.deleteIfExists(tmp);
                }
            } catch (Exception ignored) {
            }
        }
    }

    @Transactional
    public ClipResponse create(ClipCreateRequest req, User creator) {
        Stream stream = streamRepository.findById(req.getStreamId())
                .orElseThrow(() -> new NotFoundException("Stream not found"));
        Channel ch = stream.getChannel();
        Clip clip = Clip.builder()
                .stream(stream)
                .channel(ch)
                .creator(creator)
                .title(req.getTitle())
                .clipUrl(req.getClipUrl())
                .thumbnailUrl(req.getThumbnailUrl())
                .build();
        clip = clipRepository.save(clip);
        return toDto(clip);
    }

    @Transactional(readOnly = true)
    public Page<ClipResponse> listByChannel(String username, Pageable pageable) {
        Channel ch = channelRepository.findByUserUsername(username)
                .orElseThrow(() -> new NotFoundException("Channel not found"));
        return clipRepository.findByChannelOrderByCreatedAtDesc(ch, pageable).map(this::toDto);
    }

    @Transactional
    public long like(UUID id) {
        Clip clip = clipRepository.findById(id).orElseThrow(() -> new NotFoundException("Clip not found"));
        clip.setLikeCount(clip.getLikeCount() == null ? 1 : clip.getLikeCount() + 1);
        return clipRepository.save(clip).getLikeCount();
    }

    @Transactional
    public void delete(UUID id, User actor) {
        Clip clip = clipRepository.findById(id).orElseThrow(() -> new NotFoundException("Clip not found"));
        // Allow channel owner or clip creator
        if (!clip.getChannel().getUser().getId().equals(actor.getId())
                && (clip.getCreator() == null || !clip.getCreator().getId().equals(actor.getId()))) {
            throw new com.mado.exception.BadRequestException("Not authorized to delete this clip");
        }
        clipRepository.delete(clip);
    }

    private ClipResponse toDto(Clip c) {
        return ClipResponse.builder()
                .id(c.getId())
                .channelId(c.getChannel().getId())
                .channelUsername(c.getChannel().getUser().getUsername())
                .title(c.getTitle())
                .clipUrl(c.getClipUrl())
                .thumbnailUrl(c.getThumbnailUrl())
                .viewCount(c.getViewCount() == null ? 0 : c.getViewCount())
                .createdAt(c.getCreatedAt())
                .build();
    }
}
