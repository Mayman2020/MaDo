package com.mado.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
@Entity
@Table(name = "stream_stats_monthly", schema = "kick_live",
       uniqueConstraints = @UniqueConstraint(columnNames = {"channel_id", "stat_year", "stat_month"}))
public class StreamStatsMonthly {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "channel_id", nullable = false)
    private Channel channel;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @Column(name = "stat_year", nullable = false)
    private int statYear;

    @Column(name = "stat_month", nullable = false)
    private int statMonth;

    @Column(name = "total_views")
    private long totalViews;

    @Column(name = "unique_viewers")
    private int uniqueViewers;

    @Column(name = "peak_viewers")
    private int peakViewers;

    @Column(name = "avg_viewers")
    private int avgViewers;

    @Column(name = "total_hours", precision = 10, scale = 2)
    private BigDecimal totalHours = BigDecimal.ZERO;

    @Column(name = "stream_count")
    private int streamCount;

    @Column(name = "new_followers")
    private int newFollowers;

    @Column(name = "new_subs")
    private int newSubs;

    @Column(name = "total_revenue", precision = 10, scale = 2)
    private BigDecimal totalRevenue = BigDecimal.ZERO;

    @Column(name = "bonus_paid", precision = 10, scale = 2)
    private BigDecimal bonusPaid = BigDecimal.ZERO;

    @Column(name = "revenue_split_pct")
    private int revenueSplitPct = 80;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @PrePersist
    void prePersist() { createdAt = Instant.now(); }
}
