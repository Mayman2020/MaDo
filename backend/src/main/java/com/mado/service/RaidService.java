package com.mado.service;

import com.mado.entity.Channel;
import com.mado.entity.Raid;
import com.mado.entity.User;
import com.mado.exception.BadRequestException;
import com.mado.repository.RaidRepository;
import com.mado.security.ChannelAuthorizationHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RaidService {

    private final RaidRepository raidRepository;
    private final ChannelAuthorizationHelper channelAuth;

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
        return raidRepository.save(raid);
    }

    @Transactional
    public Raid complete(UUID raidId, User actor) {
        Raid r = raidRepository.findById(raidId).orElseThrow(() -> new com.mado.exception.NotFoundException("Raid not found"));
        channelAuth.requireOwnerOrModerator(r.getTargetChannel(), actor);
        r.setStatus("COMPLETED");
        return raidRepository.save(r);
    }
}
