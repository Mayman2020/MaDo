package com.mado.service;

import com.mado.config.StreamingProperties;
import com.mado.dto.CategoryResponse;
import com.mado.dto.ChannelPublicResponse;
import com.mado.dto.ChannelStatsResponse;
import com.mado.dto.ChannelUpdateRequest;
import com.mado.dto.LiveStreamResponse;
import com.mado.entity.Category;
import com.mado.entity.Channel;
import com.mado.entity.Role;
import com.mado.entity.Stream;
import com.mado.entity.User;
import com.mado.exception.BadRequestException;
import com.mado.exception.NotFoundException;
import com.mado.repository.CategoryRepository;
import com.mado.repository.ChannelRepository;
import com.mado.repository.StreamRepository;
import com.mado.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ChannelService {

    private final ChannelRepository channelRepository;
    private final CategoryRepository categoryRepository;
    private final StreamRepository streamRepository;
    private final UserRepository userRepository;
    private final StreamingProperties streamingProperties;

    @Transactional
    public ChannelPublicResponse getByUsername(String username) {
        return channelRepository.findByUserUsername(username)
                .map(this::toPublic)
                .orElseGet(() -> userRepository.findByUsername(username)
                        .map(this::getOrCreateForUser)
                        .map(this::toPublic)
                        .orElseThrow(() -> new NotFoundException("Channel not found")));
    }

    @Transactional
    public ChannelPublicResponse updateChannel(String username, ChannelUpdateRequest req, User actor) {
        Channel ch = channelRepository.findByUserUsername(username)
                .orElseThrow(() -> new NotFoundException("Channel not found"));
        if (!ch.getUser().getId().equals(actor.getId()) && actor.getRole() != Role.ADMIN) {
            throw new BadRequestException("Not allowed");
        }
        if (req.getTitle() != null) {
            ch.setTitle(req.getTitle());
        }
        if (req.getDescription() != null) {
            ch.setDescription(req.getDescription());
        }
        if (req.getCategorySlug() != null && !req.getCategorySlug().isBlank()) {
            Category cat = categoryRepository.findBySlug(req.getCategorySlug())
                    .orElseThrow(() -> new BadRequestException("Unknown category"));
            ch.setCategory(cat);
        }
        return toPublic(ch);
    }

    @Transactional(readOnly = true)
    public ChannelStatsResponse stats(String username) {
        Channel ch = channelRepository.findByUserUsername(username)
                .orElseThrow(() -> new NotFoundException("Channel not found"));
        return ChannelStatsResponse.builder()
                .followerCount(ch.getFollowerCount() == null ? 0 : ch.getFollowerCount())
                .subscriberCount(ch.getSubscriberCount() == null ? 0 : ch.getSubscriberCount())
                .totalViews(ch.getTotalViews() == null ? 0 : ch.getTotalViews())
                .peakViewerCount(ch.getPeakViewerCount() == null ? 0 : ch.getPeakViewerCount())
                .build();
    }

    @Transactional
    public String resetStreamKey(String username, User actor) {
        Channel ch = channelRepository.findByUserUsername(username)
                .orElseThrow(() -> new NotFoundException("Channel not found"));
        if (!ch.getUser().getId().equals(actor.getId()) && actor.getRole() != Role.ADMIN) {
            throw new BadRequestException("Not allowed");
        }
        ch.setStreamKey(UUID.randomUUID().toString());
        return ch.getStreamKey();
    }

    @Transactional(readOnly = true)
    public Page<LiveStreamResponse> liveChannels(Pageable pageable) {
        return channelRepository.findByIsLiveTrueOrderByViewerCountDesc(pageable)
                .map(this::toLive);
    }

    /** Live streams limited to a set of channel IDs (e.g. followed channels). */
    @Transactional(readOnly = true)
    public Page<LiveStreamResponse> liveChannelsForChannelIds(List<UUID> channelIds, Pageable pageable) {
        if (channelIds == null || channelIds.isEmpty()) {
            return Page.empty(pageable);
        }
        return channelRepository.findByIdInAndIsLiveTrueOrderByViewerCountDesc(channelIds, pageable)
                .map(this::toLive);
    }

    @Transactional(readOnly = true)
    public Page<LiveStreamResponse> liveByCategory(String slug, Pageable pageable) {
        return channelRepository.findByCategory_SlugAndIsLiveTrueOrderByViewerCountDesc(slug, pageable)
                .map(this::toLive);
    }

    public Channel getOrCreateForUser(User user) {
        return channelRepository.findByUserUsername(user.getUsername())
                .orElseGet(() -> channelRepository.save(Channel.builder()
                        .user(user)
                        .streamKey(UUID.randomUUID().toString())
                        .title("Welcome to " + user.getUsername() + "'s channel!")
                        .build()));
    }

    private LiveStreamResponse toLive(Channel ch) {
        UUID streamId = streamRepository
                .findFirstByChannelIdAndEndedAtIsNullOrderByStartedAtDesc(ch.getId())
                .map(Stream::getId)
                .orElse(null);
        String slug = ch.getCategory() != null ? ch.getCategory().getSlug() : null;
        return LiveStreamResponse.builder()
                .channelId(ch.getId())
                .username(ch.getUser().getUsername())
                .title(ch.getTitle())
                .thumbnailUrl(ch.getThumbnailUrl())
                .viewerCount(ch.getViewerCount() == null ? 0 : ch.getViewerCount())
                .categorySlug(slug)
                .streamId(streamId)
                .hlsMasterUrl(streamingProperties.getHlsBaseUrl() + "/" + ch.getStreamKey() + "/index.m3u8")
                .build();
    }

    @Transactional(readOnly = true)
    public ChannelPublicResponse toPublicDto(Channel ch) {
        return toPublic(ch);
    }

    private ChannelPublicResponse toPublic(Channel ch) {
        boolean live = Boolean.TRUE.equals(ch.getIsLive());
        UUID currentStreamId = live
                ? streamRepository.findFirstByChannelIdAndEndedAtIsNullOrderByStartedAtDesc(ch.getId())
                .map(Stream::getId)
                .orElse(null)
                : null;
        return ChannelPublicResponse.builder()
                .id(ch.getId())
                .username(ch.getUser().getUsername())
                .title(ch.getTitle())
                .description(ch.getDescription())
                .thumbnailUrl(ch.getThumbnailUrl())
                .isLive(live)
                .viewerCount(ch.getViewerCount() == null ? 0 : ch.getViewerCount())
                .categorySlug(ch.getCategory() != null ? ch.getCategory().getSlug() : null)
                .categoryName(ch.getCategory() != null ? ch.getCategory().getName() : null)
                .streamKey(ch.getStreamKey())
                .hlsMasterUrl(live
                        ? streamingProperties.getHlsBaseUrl() + "/" + ch.getStreamKey() + "/index.m3u8"
                        : null)
                .currentStreamId(currentStreamId)
                .build();
    }

    @Transactional(readOnly = true)
    public Page<CategoryResponse> allCategories(Pageable pageable) {
        return categoryRepository.findAll(pageable)
                .map(c -> CategoryResponse.builder()
                        .id(c.getId())
                        .name(c.getName())
                        .slug(c.getSlug())
                        .thumbnailUrl(c.getThumbnailUrl())
                        .viewerCount(c.getViewerCount() == null ? 0 : c.getViewerCount())
                        .build());
    }
}
