package com.mado.repository;

import com.mado.entity.Follow;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FollowRepository extends JpaRepository<Follow, UUID> {

    boolean existsByFollowerIdAndChannelId(UUID followerId, UUID channelId);

    Optional<Follow> findByFollowerIdAndChannelId(UUID followerId, UUID channelId);

    List<Follow> findByFollowerIdOrderByCreatedAtDesc(UUID followerId);
}
