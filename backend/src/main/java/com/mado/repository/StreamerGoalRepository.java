package com.mado.repository;

import com.mado.entity.StreamerGoal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface StreamerGoalRepository extends JpaRepository<StreamerGoal, UUID> {

    List<StreamerGoal> findByChannelIdAndActiveOrderByCreatedAtDesc(UUID channelId, boolean active);

    List<StreamerGoal> findByChannelIdOrderByCreatedAtDesc(UUID channelId);
}
