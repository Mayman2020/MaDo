package com.mado.repository;

import com.mado.entity.Channel;
import com.mado.entity.Clip;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface ClipRepository extends JpaRepository<Clip, UUID> {

    Page<Clip> findByOrderByCreatedAtDesc(Pageable pageable);

    Page<Clip> findByTitleContainingIgnoreCase(String q, Pageable pageable);

    Page<Clip> findByChannelOrderByCreatedAtDesc(Channel channel, Pageable pageable);

    @Query("SELECT COALESCE(MAX(c.viewCount), 0) FROM Clip c WHERE c.channel.id = :channelId")
    long findMaxViewCountByChannelId(@Param("channelId") UUID channelId);
}
