package com.mado.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "subscriptions")
public class Subscription {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subscriber_id", nullable = false)
    private User subscriber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "channel_id", nullable = false)
    private Channel channel;

    @Enumerated(EnumType.STRING)
    @Column(length = 10)
    private SubscriptionTier tier;

    private BigDecimal price;

    @Column(name = "stripe_sub_id", length = 200)
    private String stripeSubId;

    @Column(name = "is_active")
    private Boolean isActive;

    @Column(name = "is_gifted")
    private Boolean isGifted;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gifted_by")
    private User giftedBy;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "renewed_at")
    private Instant renewedAt;

    @Column(name = "created_at")
    private Instant createdAt;

    @PrePersist
    public void prePersist() {
        if (startedAt == null) {
            startedAt = Instant.now();
        }
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (isActive == null) {
            isActive = true;
        }
        if (isGifted == null) {
            isGifted = false;
        }
        if (tier == null) {
            tier = SubscriptionTier.TIER1;
        }
    }
}
