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
@Table(name = "bans")
public class Ban {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "channel_id", nullable = false)
    private Channel channel;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "banned_user_id", nullable = false)
    private User bannedUser;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "banned_by")
    private User bannedBy;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Column(name = "is_timeout")
    private Boolean isTimeout;

    @Column(name = "timeout_until")
    private Instant timeoutUntil;

    @Column(name = "is_permanent")
    private Boolean isPermanent;

    @Column(name = "created_at")
    private Instant createdAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (isTimeout == null) {
            isTimeout = false;
        }
        if (isPermanent == null) {
            isPermanent = false;
        }
    }
}
