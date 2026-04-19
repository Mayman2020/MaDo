package com.mado.repository;

import com.mado.entity.Stream;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface StreamRepository extends JpaRepository<Stream, UUID> {

    Optional<Stream> findFirstByChannelIdAndEndedAtIsNullOrderByStartedAtDesc(UUID channelId);
}
