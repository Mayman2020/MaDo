package com.mado.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
@Entity
@Table(name = "stream_stats_daily", schema = "kick_live",
       uniqueConstraints = @UniqueConstraint(columnNames = {"channel_id", "stat_date"}))
public class StreamStatsDaily {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "channel_id", nullable = false)
    private Channel channel;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @Column(name = "stat_date", nullable = false)
    private LocalDate statDate;

    @Column(name = "total_views")
    private long totalViews;

    @Column(name = "unique_viewers")
    private int uniqueViewers;

    @Column(name = "peak_viewers")
    private int peakViewers;

    @Column(name = "avg_viewers")
    private int avgViewers;

    @Column(name = "stream_minutes")
    private int streamMinutes;

    @Column(name = "new_followers")
    private int newFollowers;

    @Column(name = "new_subs")
    private int newSubs;

    @Column(name = "chat_messages")
    private int chatMessages;

    @Column(name = "clips_created")
    private int clipsCreated;

    @Column(name = "revenue_usd", precision = 10, scale = 2)
    private BigDecimal revenueUsd = BigDecimal.ZERO;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @PrePersist
    void prePersist() { createdAt = Instant.now(); }
}
