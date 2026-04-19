package com.mado.service;

import com.mado.entity.Gift;
import com.mado.entity.User;
import com.mado.repository.GiftRepository;
import com.mado.security.ChannelAuthorizationHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class GiftService {

    private final GiftRepository giftRepository;
    private final ChannelAuthorizationHelper channelAuth;

    @Transactional(readOnly = true)
    public Page<Gift> list(String username, Pageable pageable) {
        var ch = channelAuth.channelByUsername(username);
        return giftRepository.findByChannelIdOrderByCreatedAtDesc(ch.getId(), pageable);
    }

    @Transactional
    public Gift send(String username, User gifter, User recipient, String tier, int quantity) {
        var ch = channelAuth.channelByUsername(username);
        return giftRepository.save(Gift.builder()
                .channel(ch)
                .gifter(gifter)
                .recipient(recipient)
                .tier(tier != null ? tier : "TIER1")
                .quantity(quantity > 0 ? quantity : 1)
                .build());
    }
}
