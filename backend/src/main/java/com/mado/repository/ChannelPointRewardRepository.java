package com.mado.repository;

import com.mado.entity.ChannelPointReward;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ChannelPointRewardRepository extends JpaRepository<ChannelPointReward, UUID> {

    List<ChannelPointReward> findByChannelIdAndIsEnabledTrue(UUID channelId);
}
