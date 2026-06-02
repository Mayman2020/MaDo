package com.mado.repository;

import com.mado.entity.Stream;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface StreamRepository extends JpaRepository<Stream, UUID> {

    Optional<Stream> findFirstByChannelIdAndEndedAtIsNullOrderByStartedAtDesc(UUID channelId);

    @Query("select s from Stream s join fetch s.channel ch join fetch ch.user where s.id = :id")
    Optional<Stream> findByIdWithChannelAndUser(@Param("id") UUID id);

    long countByChannelId(UUID channelId);

    @Query("SELECT s FROM Stream s WHERE s.channel.isLive = true")
    java.util.List<Stream> findAllLiveStreams();
}
