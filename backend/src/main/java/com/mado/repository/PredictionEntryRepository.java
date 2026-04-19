package com.mado.repository;

import com.mado.entity.PredictionEntry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PredictionEntryRepository extends JpaRepository<PredictionEntry, UUID> {

    Optional<PredictionEntry> findByPrediction_IdAndUser_Id(UUID predictionId, UUID userId);

    List<PredictionEntry> findByPrediction_Id(UUID predictionId);
}
