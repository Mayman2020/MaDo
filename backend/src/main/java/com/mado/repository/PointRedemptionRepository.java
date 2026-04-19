package com.mado.repository;

import com.mado.entity.PointRedemption;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface PointRedemptionRepository extends JpaRepository<PointRedemption, UUID> {
}
