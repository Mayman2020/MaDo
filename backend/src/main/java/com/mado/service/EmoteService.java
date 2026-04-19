package com.mado.service;

import com.mado.entity.Emote;
import com.mado.entity.User;
import com.mado.exception.BadRequestException;
import com.mado.repository.EmoteRepository;
import com.mado.security.ChannelAuthorizationHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EmoteService {

    private final EmoteRepository emoteRepository;
    private final ChannelAuthorizationHelper channelAuth;

    @Transactional(readOnly = true)
    public List<Emote> list(String username) {
        var ch = channelAuth.channelByUsername(username);
        return emoteRepository.findByChannelIdAndIsActiveTrue(ch.getId());
    }

    @Transactional
    public Emote create(String username, Emote body, User actor) {
        var ch = channelAuth.channelByUsername(username);
        channelAuth.requireOwnerOrModerator(ch, actor);
        if (emoteRepository.findByCodeAndIsActiveTrue(body.getCode()).isPresent()) {
            throw new BadRequestException("Emote code already in use");
        }
        body.setChannel(ch);
        return emoteRepository.save(body);
    }

    @Transactional
    public void delete(String username, UUID emoteId, User actor) {
        var ch = channelAuth.channelByUsername(username);
        channelAuth.requireOwnerOrModerator(ch, actor);
        Emote e = emoteRepository.findById(emoteId).orElseThrow(() -> new com.mado.exception.NotFoundException("Emote not found"));
        if (!e.getChannel().getId().equals(ch.getId())) {
            throw new BadRequestException("Invalid emote");
        }
        e.setIsActive(false);
        emoteRepository.save(e);
    }
}
