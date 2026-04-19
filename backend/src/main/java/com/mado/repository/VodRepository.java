package com.mado.repository;

import com.mado.entity.Vod;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface VodRepository extends JpaRepository<Vod, UUID> {

    Page<Vod> findByChannelIdAndIsPublicTrueOrderByCreatedAtDesc(UUID channelId, Pageable pageable);
}
