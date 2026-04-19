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
@Table(name = "analytics_snapshots")
public class AnalyticsSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "stream_id", nullable = false)
    private Stream stream;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "channel_id")
    private Channel channel;

    @Column(name = "viewer_count")
    private Integer viewerCount;

    @Column(name = "chat_rate")
    private Integer chatRate;

    @Column(name = "new_follows")
    private Integer newFollows;

    @Column(name = "new_subs")
    private Integer newSubs;

    @Column(name = "snapshot_at")
    private Instant snapshotAt;

    @PrePersist
    public void prePersist() {
        if (snapshotAt == null) {
            snapshotAt = Instant.now();
        }
        if (viewerCount == null) {
            viewerCount = 0;
        }
        if (chatRate == null) {
            chatRate = 0;
        }
        if (newFollows == null) {
            newFollows = 0;
        }
        if (newSubs == null) {
            newSubs = 0;
        }
    }
}
