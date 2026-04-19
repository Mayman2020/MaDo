package com.mado.repository;

import com.mado.entity.Moderator;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ModeratorRepository extends JpaRepository<Moderator, UUID> {

    boolean existsByChannelIdAndUserId(UUID channelId, UUID userId);

    Optional<Moderator> findByChannelIdAndUserId(UUID channelId, UUID userId);

    List<Moderator> findByChannelId(UUID channelId);

    void deleteByChannelIdAndUserId(UUID channelId, UUID userId);
}
