package com.mado.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
@Entity
@Table(name = "rankings", schema = "kick_live")
public class Ranking {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "channel_id", nullable = false)
    private Channel channel;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @Column(name = "ranking_type", nullable = false, length = 50)
    private String rankingType;

    @Column(name = "rank_position", nullable = false)
    private int rankPosition;

    @Column(name = "metric_value", nullable = false)
    private long metricValue;

    @Column(name = "period_start", nullable = false)
    private Instant periodStart;

    @Column(name = "period_end", nullable = false)
    private Instant periodEnd;

    @Column(name = "calculated_at")
    private Instant calculatedAt;

    @PrePersist
    void prePersist() { calculatedAt = Instant.now(); }
}
