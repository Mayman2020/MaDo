package com.mado.security;

import com.mado.entity.Channel;
import com.mado.entity.Role;
import com.mado.entity.User;
import com.mado.exception.BadRequestException;
import com.mado.repository.ChannelRepository;
import com.mado.repository.ModeratorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class ChannelAuthorizationHelper {

    private final ChannelRepository channelRepository;
    private final ModeratorRepository moderatorRepository;

    public Channel channelByUsername(String username) {
        return channelRepository.findByUserUsername(username)
                .orElseThrow(() -> new com.mado.exception.NotFoundException("Channel not found"));
    }

    public void requireOwner(Channel channel, User actor) {
        if (actor.getRole() == Role.ADMIN) {
            return;
        }
        if (!channel.getUser().getId().equals(actor.getId())) {
            throw new BadRequestException("Not allowed");
        }
    }

    public void requireOwnerOrModerator(Channel channel, User actor) {
        if (actor.getRole() == Role.ADMIN) {
            return;
        }
        if (channel.getUser().getId().equals(actor.getId())) {
            return;
        }
        if (moderatorRepository.existsByChannelIdAndUserId(channel.getId(), actor.getId())) {
            return;
        }
        throw new BadRequestException("Not allowed");
    }

    public boolean isModerator(UUID channelId, UUID userId) {
        return moderatorRepository.existsByChannelIdAndUserId(channelId, userId);
    }
}
