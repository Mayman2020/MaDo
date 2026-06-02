package com.mado.repository;

import com.mado.entity.Payout;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface PayoutRepository extends JpaRepository<Payout, UUID> {

    Page<Payout> findByChannelIdOrderByCreatedAtDesc(UUID channelId, Pageable pageable);

    @Query("SELECT COALESCE(SUM(p.amountUsd), 0) FROM Payout p WHERE p.channel.id = :channelId AND p.status = 'PENDING'")
    BigDecimal sumPendingByChannel(@Param("channelId") UUID channelId);

    @Query("SELECT COALESCE(SUM(p.amountUsd), 0) FROM Payout p WHERE p.channel.id = :channelId AND p.status = 'PAID' AND p.periodYear = :year AND p.periodMonth = :month")
    BigDecimal sumPaidByChannelAndPeriod(@Param("channelId") UUID channelId, @Param("year") int year, @Param("month") int month);

    @Query("SELECT COALESCE(SUM(p.amountUsd), 0) FROM Payout p WHERE p.channel.id = :channelId AND p.status = 'PAID'")
    BigDecimal sumPaidAllTimeByChannel(@Param("channelId") UUID channelId);

    @Query("SELECT COALESCE(SUM(p.amountUsd), 0) FROM Payout p WHERE p.channel.id = :channelId AND p.status = 'PENDING' AND p.payoutType = :type")
    BigDecimal sumPendingByChannelAndType(@Param("channelId") UUID channelId, @Param("type") String type);

    @Query("SELECT p FROM Payout p WHERE p.status = 'PENDING' AND p.amountUsd >= 10")
    List<Payout> findReadyForProcessing();
}
