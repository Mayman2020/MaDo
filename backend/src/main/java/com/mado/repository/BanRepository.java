package com.mado.repository;

import com.mado.entity.Ban;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface BanRepository extends JpaRepository<Ban, UUID> {

    List<Ban> findByChannelIdOrderByCreatedAtDesc(UUID channelId);

    List<Ban> findByChannelIdAndBannedUser_IdOrderByCreatedAtDesc(UUID channelId, UUID bannedUserId);
}
