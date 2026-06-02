package com.mado.service;

import com.mado.entity.Channel;
import com.mado.entity.Raid;
import com.mado.entity.User;
import com.mado.exception.BadRequestException;
import com.mado.repository.RaidRepository;
import com.mado.security.ChannelAuthorizationHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RaidService {

    private final RaidRepository raidRepository;
    private final ChannelAuthorizationHelper channelAuth;
    private final SimpMessagingTemplate messaging;
    private final NotificationService notificationService;

    @Transactional
    public Raid start(String fromChannelUsername, String targetChannelUsername, int viewerCount, User actor) {
        Channel from = channelAuth.channelByUsername(fromChannelUsername);
        Channel target = channelAuth.channelByUsername(targetChannelUsername);
        channelAuth.requireOwnerOrModerator(from, actor);
        if (from.getId().equals(target.getId())) {
            throw new BadRequestException("Cannot raid yourself");
        }
        Raid raid = Raid.builder()
                .raidingChannel(from)
                .targetChannel(target)
                .viewerCount(viewerCount)
                .status("PENDING")
                .build();
        Raid saved = raidRepository.save(raid);
        // Notify target channel owner
        notificationService.create(target.getUser().getId(), "RAID", "Incoming Raid!",
                from.getUser().getUsername() + " is raiding you with " + viewerCount + " viewers!");
        // Broadcast STOMP event to target channel
        messaging.convertAndSend("/topic/channel." + target.getId() + ".raid",
                Map.of("raidId", saved.getId().toString(),
                        "fromUsername", from.getUser().getUsername(),
                        "viewerCount", viewerCount));
        return saved;
    }

    @Transactional
    public Raid complete(UUID raidId, User actor) {
        Raid r = raidRepository.findById(raidId).orElseThrow(() -> new com.mado.exception.NotFoundException("Raid not found"));
        channelAuth.requireOwnerOrModerator(r.getTargetChannel(), actor);
        r.setStatus("COMPLETED");
        return raidRepository.save(r);
    }
}
