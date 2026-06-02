package com.mado.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
@Entity
@Table(name = "stream_stats_hourly", schema = "kick_live")
public class StreamStatsHourly {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "channel_id", nullable = false)
    private Channel channel;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "stream_id")
    private Stream stream;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @Column(name = "snapshot_hour", nullable = false)
    private Instant snapshotHour;

    @Column(name = "viewer_count")
    private int viewerCount;

    @Column(name = "peak_viewers")
    private int peakViewers;

    @Column(name = "chat_messages")
    private int chatMessages;

    @Column(name = "new_followers")
    private int newFollowers;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @PrePersist
    void prePersist() { createdAt = Instant.now(); }
}
