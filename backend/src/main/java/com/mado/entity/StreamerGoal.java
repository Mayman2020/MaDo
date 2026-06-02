package com.mado.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
@Entity
@Table(name = "streamer_goals", schema = "kick_live")
public class StreamerGoal {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "channel_id", nullable = false)
    private Channel channel;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(name = "goal_type", nullable = false, length = 30)
    private String goalType;

    @Column(name = "target_value", nullable = false)
    private long targetValue;

    @Column(name = "current_value")
    private long currentValue;

    @Column(name = "reward_text", columnDefinition = "TEXT")
    private String rewardText;

    @Column(name = "is_active")
    private boolean active = true;

    @Column(name = "is_completed")
    private boolean completed;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @PrePersist
    void prePersist() { createdAt = Instant.now(); }
}
