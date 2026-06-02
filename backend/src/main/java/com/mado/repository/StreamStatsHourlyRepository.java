package com.mado.repository;

import com.mado.entity.StreamStatsHourly;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface StreamStatsHourlyRepository extends JpaRepository<StreamStatsHourly, UUID> {

    Optional<StreamStatsHourly> findByChannelIdAndSnapshotHour(UUID channelId, Instant snapshotHour);

    List<StreamStatsHourly> findByChannelIdAndSnapshotHourBetweenOrderBySnapshotHourAsc(
            UUID channelId, Instant from, Instant to);

    @Query("""
        SELECT s FROM StreamStatsHourly s
        WHERE s.snapshotHour = :hour
        ORDER BY s.viewerCount DESC
        LIMIT 200
        """)
    List<StreamStatsHourly> findTopByHour(@Param("hour") Instant hour);

    @Query("""
        SELECT s FROM StreamStatsHourly s
        WHERE s.channel.id = :channelId
          AND s.snapshotHour >= :from
          AND s.snapshotHour < :to
        ORDER BY s.snapshotHour ASC
        """)
    List<StreamStatsHourly> findByChannelAndRange(
            @Param("channelId") UUID channelId,
            @Param("from") Instant from,
            @Param("to") Instant to);

    @Query("""
        SELECT AVG(s.viewerCount)
        FROM StreamStatsHourly s
        WHERE s.channel.id = :channelId
          AND s.snapshotHour >= :from
          AND s.snapshotHour < :to
        """)
    Double avgViewersByChannelAndRange(
            @Param("channelId") UUID channelId,
            @Param("from") Instant from,
            @Param("to") Instant to);
}
