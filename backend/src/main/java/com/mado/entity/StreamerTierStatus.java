package com.mado.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
@Entity
@Table(name = "streamer_tier_status", schema = "kick_live")
public class StreamerTierStatus {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "channel_id", unique = true, nullable = false)
    private Channel channel;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "current_tier_id")
    private StreamerTier currentTier;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "previous_tier_id")
    private StreamerTier previousTier;

    @Column(name = "tier_achieved_at")
    private Instant tierAchievedAt;

    @Column(name = "tier_expires_at")
    private Instant tierExpiresAt;

    @Column(name = "hours_this_month", precision = 10, scale = 2)
    private BigDecimal hoursThisMonth = BigDecimal.ZERO;

    @Column(name = "avg_viewers_this_month")
    private int avgViewersThisMonth;

    @Column(name = "peak_viewers_this_month")
    private int peakViewersThisMonth;

    @Column(name = "streams_this_month")
    private int streamsThisMonth;

    @Column(name = "revenue_this_month", precision = 10, scale = 2)
    private BigDecimal revenueThisMonth = BigDecimal.ZERO;

    @Column(name = "total_stream_hours", precision = 10, scale = 2)
    private BigDecimal totalStreamHours = BigDecimal.ZERO;

    @Column(name = "total_revenue_earned", precision = 10, scale = 2)
    private BigDecimal totalRevenueEarned = BigDecimal.ZERO;

    @Column(name = "last_calculated_at")
    private Instant lastCalculatedAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist
    void prePersist() {
        lastCalculatedAt = Instant.now();
        updatedAt = Instant.now();
    }

    @PreUpdate
    void preUpdate() { updatedAt = Instant.now(); }
}
