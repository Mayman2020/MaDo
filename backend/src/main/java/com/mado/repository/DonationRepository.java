package com.mado.repository;

import com.mado.entity.Donation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface DonationRepository extends JpaRepository<Donation, UUID> {

    Page<Donation> findByChannelIdOrderByCreatedAtDesc(UUID channelId, Pageable pageable);
}
