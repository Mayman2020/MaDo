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
import com.mado.repository.StreamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
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
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public ChatMessageResponse send(UUID channelId, ChatSendRequest req, User author) {
        Channel ch = channelRepository.findById(channelId)
                .orElseThrow(() -> new NotFoundException("Channel not found"));
        if (isBanned(ch, author)) {
            throw new BadRequestException("You are banned from this channel");
        }
        assertNotBannedWord(ch.getId(), req.getContent());
        Stream stream = streamRepository.findFirstByChannelIdAndEndedAtIsNullOrderByStartedAtDesc(ch.getId())
                .orElse(null);
        ChatMessage msg = ChatMessage.builder()
                .channel(ch)
                .user(author)
                .stream(stream)
                .content(req.getContent())
                .color("#53fc18")
                .build();
        msg = chatMessageRepository.save(msg);
        ChatMessageResponse dto = toDto(msg);
        messagingTemplate.convertAndSend("/topic/channel." + channelId + ".messages", dto);
        return dto;
    }

    @Transactional(readOnly = true)
    public List<ChatMessageResponse> recent(UUID channelId, int limit) {
        List<ChatMessageResponse> list = chatMessageRepository
                .findByChannelIdAndIsDeletedFalseOrderByCreatedAtDesc(channelId, PageRequest.of(0, limit))
                .stream()
                .map(this::toDto)
                .sorted(Comparator.comparing(ChatMessageResponse::createdAt))
                .toList();
        return list;
    }

    public void broadcastViewerCount(UUID channelId, int viewers) {
        messagingTemplate.convertAndSend(
                "/topic/channel." + channelId + ".viewers",
                java.util.Map.of("viewerCount", viewers));
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
        return ChatMessageResponse.builder()
                .id(m.getId())
                .username(u != null ? u.getUsername() : "system")
                .displayName(u != null && u.getDisplayName() != null ? u.getDisplayName() : (u != null ? u.getUsername() : "System"))
                .content(m.getContent())
                .createdAt(m.getCreatedAt())
                .color(m.getColor())
                .build();
    }
}
