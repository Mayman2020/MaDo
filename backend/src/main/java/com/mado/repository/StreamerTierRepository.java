package com.mado.repository;

import com.mado.entity.StreamerTier;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface StreamerTierRepository extends JpaRepository<StreamerTier, UUID> {

    List<StreamerTier> findAllByOrderBySortOrderAsc();

    Optional<StreamerTier> findByName(String name);
}
