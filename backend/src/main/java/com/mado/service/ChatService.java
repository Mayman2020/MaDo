package com.mado.service;

import com.mado.dto.ChatMessageResponse;
import com.mado.dto.ChatSendRequest;
import com.mado.entity.Channel;
import com.mado.entity.ChatMessage;
import com.mado.entity.Stream;
import com.mado.entity.User;
import com.mado.entity.Ban;
import com.mado.exception.BadRequestException;
import com.mado.exception.NotFoundException;
import com.mado.repository.BanRepository;
import com.mado.repository.BannedWordRepository;
import com.mado.repository.ChannelRepository;
import com.mado.repository.ChatMessageRepository;
import com.mado.repository.FollowRepository;
import com.mado.repository.ModeratorRepository;
import com.mado.repository.StreamRepository;
import com.mado.repository.SubscriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final ChannelRepository channelRepository;
    private final StreamRepository streamRepository;
    private final BanRepository banRepository;
    private final BannedWordRepository bannedWordRepository;
    private final FollowRepository followRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final ModeratorRepository moderatorRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public ChatMessageResponse send(UUID channelId, ChatSendRequest req, User author) {
        Channel ch = channelRepository.findById(channelId)
                .orElseThrow(() -> new NotFoundException("Channel not found"));

        boolean isOwner = ch.getUser().getId().equals(author.getId());
        boolean isMod = moderatorRepository.existsByChannelIdAndUserId(channelId, author.getId());

        if (!isOwner && !isMod) {
            if (isBanned(ch, author)) {
                throw new BadRequestException("You are banned from this channel");
            }
            assertChatModes(ch, author);
        }

        assertNotBannedWord(ch.getId(), req.getContent());

        List<String> badges = buildBadges(ch, author, isOwner, isMod);

        Stream stream = streamRepository.findFirstByChannelIdAndEndedAtIsNullOrderByStartedAtDesc(ch.getId())
                .orElse(null);
        ChatMessage msg = ChatMessage.builder()
                .channel(ch)
                .user(author)
                .stream(stream)
                .content(req.getContent())
                .color("#53fc18")
                .badges(badges.isEmpty() ? null : badges.toArray(new String[0]))
                .build();
        msg = chatMessageRepository.save(msg);
        ChatMessageResponse dto = toDto(msg);
        messagingTemplate.convertAndSend("/topic/channel." + channelId + ".messages", dto);
        return dto;
    }

    @Transactional(readOnly = true)
    public List<ChatMessageResponse> recent(UUID channelId, int limit) {
        return chatMessageRepository
                .findByChannelIdAndIsDeletedFalseOrderByCreatedAtDesc(channelId, PageRequest.of(0, limit))
                .stream()
                .map(this::toDto)
                .sorted(Comparator.comparing(ChatMessageResponse::createdAt))
                .toList();
    }

    public void broadcastViewerCount(UUID channelId, int viewers) {
        messagingTemplate.convertAndSend(
                "/topic/channel." + channelId + ".viewers",
                java.util.Map.of("viewerCount", viewers));
    }

    private void assertChatModes(Channel ch, User author) {
        int slowSec = ch.getSlowModeSeconds() != null ? ch.getSlowModeSeconds() : 0;
        if (slowSec > 0) {
            List<ChatMessage> last = chatMessageRepository
                    .findTop1ByChannelIdAndUser_IdAndIsDeletedFalseOrderByCreatedAtDesc(ch.getId(), author.getId());
            if (!last.isEmpty()) {
                Instant allowedAt = last.get(0).getCreatedAt().plusSeconds(slowSec);
                if (Instant.now().isBefore(allowedAt)) {
                    long waitMs = Instant.now().until(allowedAt, ChronoUnit.SECONDS);
                    throw new BadRequestException("Slow mode — wait " + waitMs + "s before sending another message");
                }
            }
        }

        if (Boolean.TRUE.equals(ch.getFollowersOnlyMode())) {
            boolean follows = followRepository.existsByFollowerIdAndChannelId(author.getId(), ch.getId());
            if (!follows) {
                throw new BadRequestException("Followers-only mode — follow the channel to chat");
            }
        }

        if (Boolean.TRUE.equals(ch.getSubscribersOnlyMode())) {
            boolean subbed = subscriptionRepository
                    .findBySubscriber_IdAndChannel_IdAndIsActiveTrue(author.getId(), ch.getId())
                    .isPresent();
            if (!subbed) {
                throw new BadRequestException("Subscribers-only mode — subscribe to chat");
            }
        }

        int minAgeDays = ch.getMinAccountAgeDays() != null ? ch.getMinAccountAgeDays() : 0;
        if (minAgeDays > 0 && author.getCreatedAt() != null) {
            long ageDays = author.getCreatedAt().until(Instant.now(), ChronoUnit.DAYS);
            if (ageDays < minAgeDays) {
                throw new BadRequestException("Account must be at least " + minAgeDays + " day(s) old to chat here");
            }
        }
    }

    private List<String> buildBadges(Channel ch, User author, boolean isOwner, boolean isMod) {
        List<String> badges = new ArrayList<>();
        if (isOwner) {
            badges.add("streamer");
        } else if (isMod) {
            badges.add("mod");
        }
        boolean subbed = subscriptionRepository
                .findBySubscriber_IdAndChannel_IdAndIsActiveTrue(author.getId(), ch.getId())
                .isPresent();
        if (subbed) {
            badges.add("sub");
        }
        return badges;
    }

    private boolean isBanned(Channel ch, User author) {
        List<Ban> bans = banRepository.findByChannelIdAndBannedUser_IdOrderByCreatedAtDesc(ch.getId(), author.getId());
        if (bans.isEmpty()) {
            return false;
        }
        Ban latest = bans.get(0);
        if (Boolean.TRUE.equals(latest.getIsPermanent())) {
            return true;
        }
        if (Boolean.TRUE.equals(latest.getIsTimeout()) && latest.getTimeoutUntil() != null) {
            return latest.getTimeoutUntil().isAfter(Instant.now());
        }
        return false;
    }

    private void assertNotBannedWord(UUID channelId, String content) {
        String lower = content.toLowerCase(Locale.ROOT);
        for (var bw : bannedWordRepository.findByChannelId(channelId)) {
            if (lower.contains(bw.getWord().toLowerCase(Locale.ROOT))) {
                throw new BadRequestException("Message contains a banned word");
            }
        }
    }

    private ChatMessageResponse toDto(ChatMessage m) {
        User u = m.getUser();
        List<String> badges = m.getBadges() != null ? List.of(m.getBadges()) : List.of();
        return ChatMessageResponse.builder()
                .id(m.getId())
                .username(u != null ? u.getUsername() : "system")
                .displayName(u != null && u.getDisplayName() != null ? u.getDisplayName() : (u != null ? u.getUsername() : "System"))
                .content(m.getContent())
                .createdAt(m.getCreatedAt())
                .color(m.getColor())
                .badges(badges)
                .build();
    }
}
