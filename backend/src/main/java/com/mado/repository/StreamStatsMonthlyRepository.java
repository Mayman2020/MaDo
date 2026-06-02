package com.mado.repository;

import com.mado.entity.StreamStatsMonthly;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface StreamStatsMonthlyRepository extends JpaRepository<StreamStatsMonthly, UUID> {

    Optional<StreamStatsMonthly> findByChannelIdAndStatYearAndStatMonth(UUID channelId, int year, int month);

    List<StreamStatsMonthly> findByStatYearAndStatMonthOrderByTotalViewsDesc(int year, int month);

    @Query("""
        SELECT s FROM StreamStatsMonthly s
        WHERE s.statYear = :year AND s.statMonth = :month
        ORDER BY s.totalHours DESC
        LIMIT 200
        """)
    List<StreamStatsMonthly> findTopByHours(@Param("year") int year, @Param("month") int month);

    List<StreamStatsMonthly> findByChannelIdOrderByStatYearDescStatMonthDesc(UUID channelId);
}
