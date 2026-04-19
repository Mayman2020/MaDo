package com.mado.repository;

import com.mado.entity.Gift;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface GiftRepository extends JpaRepository<Gift, UUID> {

    Page<Gift> findByChannelIdOrderByCreatedAtDesc(UUID channelId, Pageable pageable);
}
