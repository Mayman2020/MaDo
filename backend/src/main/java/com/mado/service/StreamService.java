package com.mado.service;

import com.mado.dto.LiveStreamResponse;
import com.mado.dto.StreamDetailResponse;
import com.mado.dto.StreamPublishRequest;
import com.mado.entity.Channel;
import com.mado.entity.Stream;
import com.mado.exception.NotFoundException;
import com.mado.repository.ChannelRepository;
import com.mado.repository.StreamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class StreamService {

    private final ChannelRepository channelRepository;
    private final StreamRepository streamRepository;
    private final ChannelService channelService;

    @Transactional
    public Map<String, String> onPublish(StreamPublishRequest request) {
        if (request == null || request.getName() == null || request.getName().isBlank()) {
            return Map.of("status", "rejected", "reason", "missing stream name");
        }
        Channel ch = channelRepository.findByStreamKey(request.getName())
                .orElseThrow(() -> new NotFoundException("Invalid stream key"));
        ch.setIsLive(true);
        Stream stream = Stream.builder()
                .channel(ch)
                .title(ch.getTitle())
                .category(ch.getCategory())
                .language(ch.getLanguage())
                .tags(ch.getTags())
                .isMature(ch.getIsMature())
                .startedAt(Instant.now())
                .build();
        streamRepository.save(stream);
        return Map.of("status", "live", "channelId", ch.getId().toString());
    }

    @Transactional
    public Map<String, String> onPublishDone(StreamPublishRequest request) {
        if (request == null || request.getName() == null || request.getName().isBlank()) {
            return Map.of("status", "ignored");
        }
        Channel ch = channelRepository.findByStreamKey(request.getName()).orElse(null);
        if (ch == null) {
            return Map.of("status", "unknown");
        }
        ch.setIsLive(false);
        streamRepository.findFirstByChannelIdAndEndedAtIsNullOrderByStartedAtDesc(ch.getId())
                .ifPresent(s -> {
                    s.setEndedAt(Instant.now());
                    streamRepository.save(s);
                });
        return Map.of("status", "offline", "channelId", ch.getId().toString());
    }

    @Transactional(readOnly = true)
    public StreamDetailResponse getById(UUID id) {
        Stream s = streamRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Stream not found"));
        return StreamDetailResponse.builder()
                .id(s.getId())
                .channelId(s.getChannel().getId())
                .channelUsername(s.getChannel().getUser().getUsername())
                .title(s.getTitle())
                .startedAt(s.getStartedAt())
                .endedAt(s.getEndedAt())
                .peakViewers(s.getPeakViewers())
                .vodUrl(s.getVodUrl())
                .build();
    }

    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<LiveStreamResponse> live(Pageable pageable) {
        return channelService.liveChannels(pageable);
    }
}
