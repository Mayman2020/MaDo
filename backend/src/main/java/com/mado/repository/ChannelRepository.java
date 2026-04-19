package com.mado.repository;

import com.mado.entity.Channel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ChannelRepository extends JpaRepository<Channel, UUID> {

    Optional<Channel> findByUserUsername(String username);

    Optional<Channel> findByStreamKey(String streamKey);

    Page<Channel> findByIsLiveTrueOrderByViewerCountDesc(Pageable pageable);

    Page<Channel> findByCategory_SlugAndIsLiveTrueOrderByViewerCountDesc(String slug, Pageable pageable);

    Page<Channel> findByIdInAndIsLiveTrueOrderByViewerCountDesc(List<UUID> ids, Pageable pageable);

    Page<Channel> findAllByOrderByFollowerCountDesc(Pageable pageable);

    Page<Channel> findAllByOrderByTotalViewsDesc(Pageable pageable);
}
