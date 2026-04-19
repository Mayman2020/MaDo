package com.mado.repository;

import com.mado.entity.PredictionOption;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface PredictionOptionRepository extends JpaRepository<PredictionOption, UUID> {
}
