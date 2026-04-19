package com.mado.repository;

import com.mado.entity.ChannelPoint;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ChannelPointRepository extends JpaRepository<ChannelPoint, UUID> {

    Optional<ChannelPoint> findByUser_IdAndChannel_Id(UUID userId, UUID channelId);
}
