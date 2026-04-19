package com.mado.service;

import com.mado.dto.ClipCreateRequest;
import com.mado.dto.ClipResponse;
import com.mado.entity.Channel;
import com.mado.entity.Clip;
import com.mado.entity.Stream;
import com.mado.entity.User;
import com.mado.exception.NotFoundException;
import com.mado.repository.ChannelRepository;
import com.mado.repository.ClipRepository;
import com.mado.repository.StreamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ClipService {

    private final ClipRepository clipRepository;
    private final StreamRepository streamRepository;
    private final ChannelRepository channelRepository;

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
