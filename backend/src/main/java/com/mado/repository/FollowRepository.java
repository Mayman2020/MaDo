package com.mado.repository;

import com.mado.entity.Follow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FollowRepository extends JpaRepository<Follow, UUID> {

    boolean existsByFollowerIdAndChannelId(UUID followerId, UUID channelId);

    Optional<Follow> findByFollowerIdAndChannelId(UUID followerId, UUID channelId);

    List<Follow> findByFollowerIdOrderByCreatedAtDesc(UUID followerId);

    @Query("select f from Follow f join fetch f.follower where f.channel.id = :channelId")
    List<Follow> findAllByChannelIdWithFollower(@Param("channelId") UUID channelId);
}
