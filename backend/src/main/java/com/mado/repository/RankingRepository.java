package com.mado.repository;

import com.mado.entity.Ranking;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RankingRepository extends JpaRepository<Ranking, UUID> {

    @Modifying
    @Query("DELETE FROM Ranking r WHERE r.rankingType = :type")
    void deleteByRankingType(@Param("type") String type);

    List<Ranking> findByRankingTypeAndCategoryIsNullOrderByRankPositionAsc(String type, Pageable pageable);

    List<Ranking> findByRankingTypeAndCategoryIdOrderByRankPositionAsc(String type, UUID categoryId, Pageable pageable);

    Optional<Ranking> findByChannelIdAndRankingType(UUID channelId, String type);

    List<Ranking> findByChannelIdOrderByRankPositionAsc(UUID channelId);
}
