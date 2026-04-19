package com.mado.repository;

import com.mado.entity.AnalyticsSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AnalyticsSnapshotRepository extends JpaRepository<AnalyticsSnapshot, UUID> {

    List<AnalyticsSnapshot> findByStreamIdOrderBySnapshotAtAsc(UUID streamId);
}
