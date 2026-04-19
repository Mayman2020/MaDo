package com.mado.repository;

import com.mado.entity.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SubscriptionRepository extends JpaRepository<Subscription, UUID> {

    Optional<Subscription> findBySubscriber_IdAndChannel_IdAndIsActiveTrue(UUID subscriberId, UUID channelId);

    List<Subscription> findBySubscriber_IdAndIsActiveTrue(UUID subscriberId);
}
