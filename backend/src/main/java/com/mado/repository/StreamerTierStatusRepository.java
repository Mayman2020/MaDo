package com.mado.repository;

import com.mado.entity.StreamerTierStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface StreamerTierStatusRepository extends JpaRepository<StreamerTierStatus, UUID> {

    Optional<StreamerTierStatus> findByChannelId(UUID channelId);

    @Query("SELECT s FROM StreamerTierStatus s JOIN FETCH s.channel JOIN FETCH s.currentTier")
    List<StreamerTierStatus> findAllWithChannel();
}
