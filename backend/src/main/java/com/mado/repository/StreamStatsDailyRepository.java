package com.mado.repository;

import com.mado.entity.StreamStatsDaily;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface StreamStatsDailyRepository extends JpaRepository<StreamStatsDaily, UUID> {

    Optional<StreamStatsDaily> findByChannelIdAndStatDate(UUID channelId, LocalDate date);

    List<StreamStatsDaily> findByChannelIdAndStatDateBetweenOrderByStatDateAsc(
            UUID channelId, LocalDate from, LocalDate to);

    @Query("""
        SELECT s FROM StreamStatsDaily s
        WHERE s.statDate = :date
        ORDER BY s.totalViews DESC
        LIMIT 200
        """)
    List<StreamStatsDaily> findTopByDate(@Param("date") LocalDate date);

    @Query("""
        SELECT s FROM StreamStatsDaily s
        WHERE s.statDate >= :from AND s.statDate <= :to
        ORDER BY s.totalViews DESC
        """)
    List<StreamStatsDaily> findByDateRange(@Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("""
        SELECT s.channel.id, SUM(s.totalViews)
        FROM StreamStatsDaily s
        GROUP BY s.channel.id
        ORDER BY SUM(s.totalViews) DESC
        LIMIT 200
        """)
    List<Object[]> findAllTimeTopChannels();

    @Query("""
        SELECT s.channel.id, SUM(s.totalViews)
        FROM StreamStatsDaily s
        WHERE s.category.id = :catId
        GROUP BY s.channel.id
        ORDER BY SUM(s.totalViews) DESC
        LIMIT 200
        """)
    List<Object[]> findAllTimeTopByCategory(@Param("catId") UUID catId);

    @Query("""
        SELECT s FROM StreamStatsDaily s
        WHERE s.channel.id = :channelId
        ORDER BY s.statDate DESC
        """)
    List<StreamStatsDaily> findByChannelIdOrderByDateDesc(@Param("channelId") UUID channelId);
}
