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

import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "prediction_options")
public class PredictionOption {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "prediction_id", nullable = false)
    private Prediction prediction;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(length = 20)
    private String color;

    @Column(name = "total_points")
    private Long totalPoints;

    @Column(name = "participant_count")
    private Integer participantCount;

    @PrePersist
    public void prePersist() {
        if (totalPoints == null) {
            totalPoints = 0L;
        }
        if (participantCount == null) {
            participantCount = 0;
        }
    }
}
