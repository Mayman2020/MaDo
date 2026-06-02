package com.mado.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
@Entity
@Table(name = "streamer_tiers", schema = "kick_live")
public class StreamerTier {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(name = "display_name", nullable = false, length = 50)
    private String displayName;

    @Column(name = "badge_icon")
    private String badgeIcon;

    @Column(name = "badge_color", length = 7)
    private String badgeColor;

    @Column(name = "min_hours_monthly", nullable = false)
    private int minHoursMonthly;

    @Column(name = "min_avg_viewers", nullable = false)
    private int minAvgViewers;

    @Column(name = "min_followers", nullable = false)
    private int minFollowers;

    @Column(name = "revenue_split", nullable = false)
    private int revenueSplit;

    @Column(name = "monthly_bonus_usd", precision = 10, scale = 2)
    private BigDecimal monthlyBonusUsd = BigDecimal.ZERO;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "perks", columnDefinition = "text[]")
    private List<String> perks;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @PrePersist
    void prePersist() { createdAt = Instant.now(); }
}
