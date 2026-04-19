package com.mado.service;

import com.mado.dto.ChannelPublicResponse;
import com.mado.entity.Channel;
import com.mado.entity.Follow;
import com.mado.entity.User;
import com.mado.exception.BadRequestException;
import com.mado.exception.NotFoundException;
import com.mado.dto.LiveStreamResponse;
import com.mado.repository.ChannelRepository;
import com.mado.repository.FollowRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FollowService {

    private final FollowRepository followRepository;
    private final ChannelRepository channelRepository;
    private final ChannelService channelService;

    @Transactional
    public void follow(UUID channelId, User follower) {
        Channel ch = channelRepository.findById(channelId)
                .orElseThrow(() -> new NotFoundException("Channel not found"));
        User owner = ch.getUser();
        if (owner.getId().equals(follower.getId())) {
            throw new BadRequestException("Cannot follow yourself");
        }
        if (followRepository.existsByFollowerIdAndChannelId(follower.getId(), channelId)) {
            return;
        }
        Follow f = Follow.builder()
                .follower(follower)
                .following(owner)
                .channel(ch)
                .build();
        followRepository.save(f);
        ch.setFollowerCount((ch.getFollowerCount() == null ? 0 : ch.getFollowerCount()) + 1);
    }

    @Transactional
    public void unfollow(UUID channelId, User follower) {
        Follow f = followRepository.findByFollowerIdAndChannelId(follower.getId(), channelId)
                .orElseThrow(() -> new NotFoundException("Not following"));
        Channel ch = f.getChannel();
        followRepository.delete(f);
        if (ch.getFollowerCount() != null && ch.getFollowerCount() > 0) {
            ch.setFollowerCount(ch.getFollowerCount() - 1);
        }
    }

    @Transactional(readOnly = true)
    public List<ChannelPublicResponse> following(User follower) {
        return followRepository.findByFollowerIdOrderByCreatedAtDesc(follower.getId()).stream()
                .map(Follow::getChannel)
                .map(channelService::toPublicDto)
                .toList();
    }

    /** Live streams from channels the user follows (Kick-style Following feed). */
    @Transactional(readOnly = true)
    public Page<LiveStreamResponse> liveFollowing(User follower, Pageable pageable) {
        List<UUID> ids = followRepository.findByFollowerIdOrderByCreatedAtDesc(follower.getId()).stream()
                .map(f -> f.getChannel().getId())
                .distinct()
                .toList();
        return channelService.liveChannelsForChannelIds(ids, pageable);
    }
}
