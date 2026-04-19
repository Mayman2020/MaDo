package com.mado.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "channels")
public class Channel {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(length = 140)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "stream_key", nullable = false, unique = true, length = 100)
    private String streamKey;

    @Column(name = "is_live")
    private Boolean isLive;

    @Column(name = "viewer_count")
    private Integer viewerCount;

    @Column(name = "peak_viewer_count")
    private Integer peakViewerCount;

    @Column(name = "total_views")
    private Long totalViews;

    @Column(name = "thumbnail_url", length = 500)
    private String thumbnailUrl;

    @Column(name = "offline_banner_url", length = 500)
    private String offlineBannerUrl;

    @Column(name = "subscriber_count")
    private Integer subscriberCount;

    @Column(name = "follower_count")
    private Integer followerCount;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @Column(length = 10)
    private String language;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "tags", columnDefinition = "text[]")
    private String[] tags;

    @Column(name = "is_mature")
    private Boolean isMature;

    @Column(name = "is_subscription_enabled")
    private Boolean isSubscriptionEnabled;

    @Column(name = "channel_points_enabled")
    private Boolean channelPointsEnabled;

    @Column(name = "slow_mode_seconds")
    private Integer slowModeSeconds;

    @Column(name = "followers_only_mode")
    private Boolean followersOnlyMode;

    @Column(name = "subscribers_only_mode")
    private Boolean subscribersOnlyMode;

    @Column(name = "emotes_only_mode")
    private Boolean emotesOnlyMode;

    @Column(name = "min_account_age_days")
    private Integer minAccountAgeDays;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist
    public void prePersist() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
        if (isLive == null) {
            isLive = false;
        }
        if (viewerCount == null) {
            viewerCount = 0;
        }
        if (peakViewerCount == null) {
            peakViewerCount = 0;
        }
        if (totalViews == null) {
            totalViews = 0L;
        }
        if (subscriberCount == null) {
            subscriberCount = 0;
        }
        if (followerCount == null) {
            followerCount = 0;
        }
        if (language == null) {
            language = "en";
        }
        if (isMature == null) {
            isMature = false;
        }
        if (isSubscriptionEnabled == null) {
            isSubscriptionEnabled = false;
        }
        if (channelPointsEnabled == null) {
            channelPointsEnabled = false;
        }
        if (slowModeSeconds == null) {
            slowModeSeconds = 0;
        }
        if (followersOnlyMode == null) {
            followersOnlyMode = false;
        }
        if (subscribersOnlyMode == null) {
            subscribersOnlyMode = false;
        }
        if (emotesOnlyMode == null) {
            emotesOnlyMode = false;
        }
        if (minAccountAgeDays == null) {
            minAccountAgeDays = 0;
        }
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = Instant.now();
    }
}
