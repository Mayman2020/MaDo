package com.mado.repository;

import com.mado.entity.StreamerMilestone;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface StreamerMilestoneRepository extends JpaRepository<StreamerMilestone, UUID> {

    List<StreamerMilestone> findByChannelIdOrderByEarnedAtDesc(UUID channelId);

    Optional<StreamerMilestone> findByChannelIdAndMilestoneId(UUID channelId, UUID milestoneId);

    boolean existsByChannelIdAndMilestoneId(UUID channelId, UUID milestoneId);

    @Query("SELECT sm.milestone.id FROM StreamerMilestone sm WHERE sm.channel.id = :channelId")
    List<UUID> findEarnedMilestoneIdsByChannelId(@Param("channelId") UUID channelId);

    @Query("SELECT sm FROM StreamerMilestone sm WHERE sm.notified = false")
    List<StreamerMilestone> findUnnotified();
}
