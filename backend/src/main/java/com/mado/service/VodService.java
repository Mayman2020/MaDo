package com.mado.service;

import com.mado.entity.Vod;
import com.mado.repository.VodRepository;
import com.mado.security.ChannelAuthorizationHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class VodService {

    private final VodRepository vodRepository;
    private final ChannelAuthorizationHelper channelAuth;

    @Transactional(readOnly = true)
    public Page<Vod> listPublic(String username, Pageable pageable) {
        var ch = channelAuth.channelByUsername(username);
        return vodRepository.findByChannelIdAndIsPublicTrueOrderByCreatedAtDesc(ch.getId(), pageable);
    }
}
