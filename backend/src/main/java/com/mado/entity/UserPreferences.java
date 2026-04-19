package com.mado.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
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
@Table(name = "user_preferences")
public class UserPreferences {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "email_on_live")
    private Boolean emailOnLive;

    @Column(name = "email_on_follow")
    private Boolean emailOnFollow;

    @Column(name = "email_on_sub")
    private Boolean emailOnSub;

    @Column(name = "push_on_live")
    private Boolean pushOnLive;

    @Column(name = "chat_color", length = 7)
    private String chatColor;

    @Column(name = "dark_mode")
    private Boolean darkMode;

    private Boolean autoplay;

    @Column(name = "default_quality", length = 10)
    private String defaultQuality;

    @Column(length = 10)
    private String language;

    @Column(name = "created_at")
    private Instant createdAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (emailOnLive == null) {
            emailOnLive = true;
        }
        if (emailOnFollow == null) {
            emailOnFollow = true;
        }
        if (emailOnSub == null) {
            emailOnSub = true;
        }
        if (pushOnLive == null) {
            pushOnLive = true;
        }
        if (chatColor == null) {
            chatColor = "#53fc18";
        }
        if (darkMode == null) {
            darkMode = true;
        }
        if (autoplay == null) {
            autoplay = true;
        }
        if (defaultQuality == null) {
            defaultQuality = "auto";
        }
        if (language == null) {
            language = "en";
        }
    }
}
