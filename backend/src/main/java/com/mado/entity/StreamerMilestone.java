package com.mado.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
@Entity
@Table(name = "streamer_milestones", schema = "kick_live",
       uniqueConstraints = @UniqueConstraint(columnNames = {"channel_id", "milestone_id"}))
public class StreamerMilestone {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "channel_id", nullable = false)
    private Channel channel;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "milestone_id", nullable = false)
    private Milestone milestone;

    @Column(name = "earned_at")
    private Instant earnedAt;

    @Column(name = "reward_paid")
    private boolean rewardPaid;

    @Column(name = "reward_paid_at")
    private Instant rewardPaidAt;

    @Column(name = "notified")
    private boolean notified;

    @PrePersist
    void prePersist() { earnedAt = Instant.now(); }
}
