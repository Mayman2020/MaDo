package com.mado.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "channel_point_rewards")
public class ChannelPointReward {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "channel_id", nullable = false)
    private Channel channel;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private Integer cost;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(name = "is_enabled")
    private Boolean isEnabled;

    @Column(name = "is_paused")
    private Boolean isPaused;

    @Column(name = "max_per_stream")
    private Integer maxPerStream;

    @Column(name = "max_per_user")
    private Integer maxPerUser;

    @Column(name = "redemption_count")
    private Integer redemptionCount;

    @Column(name = "created_at")
    private Instant createdAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (isEnabled == null) {
            isEnabled = true;
        }
        if (isPaused == null) {
            isPaused = false;
        }
        if (redemptionCount == null) {
            redemptionCount = 0;
        }
    }
}
