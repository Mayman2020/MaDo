package com.mado.repository;

import com.mado.entity.Channel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ChannelRepository extends JpaRepository<Channel, UUID> {

    Optional<Channel> findByUserUsername(String username);

    Optional<Channel> findByStreamKey(String streamKey);

    @Query("select c from Channel c join fetch c.user where c.streamKey = :streamKey")
    Optional<Channel> findByStreamKeyWithUser(@Param("streamKey") String streamKey);

    @Query("select c from Channel c join fetch c.user where c.id = :id")
    Optional<Channel> findByIdWithUser(@Param("id") UUID id);

    Page<Channel> findByIsLiveTrueOrderByViewerCountDesc(Pageable pageable);

    Page<Channel> findByCategory_SlugAndIsLiveTrueOrderByViewerCountDesc(String slug, Pageable pageable);

    Page<Channel> findByIdInAndIsLiveTrueOrderByViewerCountDesc(List<UUID> ids, Pageable pageable);

    Page<Channel> findAllByOrderByFollowerCountDesc(Pageable pageable);

    Page<Channel> findAllByOrderByTotalViewsDesc(Pageable pageable);

    long countByIsLiveTrue();
}
