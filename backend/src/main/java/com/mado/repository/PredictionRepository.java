package com.mado.repository;

import com.mado.entity.Prediction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PredictionRepository extends JpaRepository<Prediction, UUID> {

    List<Prediction> findByChannel_IdAndStatusOrderByCreatedAtDesc(UUID channelId, String status);
}
