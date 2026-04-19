package com.mado.service;

import com.mado.entity.Channel;
import com.mado.entity.Donation;
import com.mado.entity.User;
import com.mado.repository.DonationRepository;
import com.mado.security.ChannelAuthorizationHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class DonationService {

    private final DonationRepository donationRepository;
    private final ChannelAuthorizationHelper channelAuth;

    @Transactional(readOnly = true)
    public Page<Donation> listForChannel(String username, Pageable pageable) {
        Channel ch = channelAuth.channelByUsername(username);
        return donationRepository.findByChannelIdOrderByCreatedAtDesc(ch.getId(), pageable);
    }

    @Transactional
    public Donation donate(String username, BigDecimal amount, String message, User donor) {
        Channel ch = channelAuth.channelByUsername(username);
        return donationRepository.save(Donation.builder()
                .channel(ch)
                .donor(donor)
                .amount(amount)
                .message(message)
                .status("COMPLETED")
                .build());
    }
}
