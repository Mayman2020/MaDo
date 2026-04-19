package com.mado.repository;

import com.mado.entity.Raid;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface RaidRepository extends JpaRepository<Raid, UUID> {
}
