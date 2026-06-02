package com.mado.service;

import com.mado.entity.User;
import com.mado.entity.Vod;
import com.mado.exception.BadRequestException;
import com.mado.exception.NotFoundException;
import com.mado.repository.VodRepository;
import com.mado.security.ChannelAuthorizationHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class VodService {

    private final VodRepository vodRepository;
    private final ChannelAuthorizationHelper channelAuth;
    private final ChannelService channelService;

    @Transactional(readOnly = true)
    public Page<Vod> listPublic(String username, Pageable pageable) {
        var ch = channelAuth.channelByUsername(username);
        return vodRepository.findByChannelIdAndIsPublicTrueOrderByCreatedAtDesc(ch.getId(), pageable);
    }

    /** All VODs for the signed-in streamer's channel (including private). */
    @Transactional(readOnly = true)
    public Page<Vod> listMine(User actor, Pageable pageable) {
        var ch = channelService.getOrCreateForUser(actor);
        return vodRepository.findByChannelIdOrderByCreatedAtDesc(ch.getId(), pageable);
    }

    @Transactional
    public Vod update(String username, UUID vodId, Map<String, Object> body, User actor) {
        var ch = channelAuth.channelByUsername(username);
        if (!ch.getUser().getId().equals(actor.getId())) {
            throw new BadRequestException("Not authorized");
        }
        Vod vod = vodRepository.findById(vodId).orElseThrow(() -> new NotFoundException("VOD not found"));
        if (!vod.getChannel().getId().equals(ch.getId())) {
            throw new BadRequestException("VOD does not belong to this channel");
        }
        if (body.containsKey("title")) {
            vod.setTitle((String) body.get("title"));
        }
        if (body.containsKey("isPublic")) {
            vod.setIsPublic((Boolean) body.get("isPublic"));
        }
        return vodRepository.save(vod);
    }

    @Transactional
    public void delete(String username, UUID vodId, User actor) {
        var ch = channelAuth.channelByUsername(username);
        if (!ch.getUser().getId().equals(actor.getId())) {
            throw new BadRequestException("Not authorized");
        }
        Vod vod = vodRepository.findById(vodId).orElseThrow(() -> new NotFoundException("VOD not found"));
        if (!vod.getChannel().getId().equals(ch.getId())) {
            throw new BadRequestException("VOD does not belong to this channel");
        }
        vodRepository.delete(vod);
    }
}
