package com.mado.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
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
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 30)
    private String username;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(name = "display_name", length = 50)
    private String displayName;

    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    @Column(name = "banner_url", length = 500)
    private String bannerUrl;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role;

    @Column(name = "is_verified")
    private Boolean isVerified;

    @Column(name = "is_active")
    private Boolean isActive;

    @Column(name = "is_banned")
    private Boolean isBanned;

    @Column(name = "ban_reason", columnDefinition = "TEXT")
    private String banReason;

    @Column(name = "two_fa_enabled")
    private Boolean twoFaEnabled;

    @Column(name = "two_fa_secret", length = 100)
    private String twoFaSecret;

    @Column(name = "follower_count")
    private Integer followerCount;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @Column(name = "last_login_at")
    private Instant lastLoginAt;

    @PrePersist
    public void prePersist() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
        if (role == null) {
            role = Role.VIEWER;
        }
        if (isVerified == null) {
            isVerified = false;
        }
        if (isActive == null) {
            isActive = true;
        }
        if (isBanned == null) {
            isBanned = false;
        }
        if (twoFaEnabled == null) {
            twoFaEnabled = false;
        }
        if (followerCount == null) {
            followerCount = 0;
        }
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = Instant.now();
    }
}
