package com.mado.repository;

import com.mado.entity.PollOption;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface PollOptionRepository extends JpaRepository<PollOption, UUID> {
}
