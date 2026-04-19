package com.mado.repository;

import com.mado.entity.Clip;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ClipRepository extends JpaRepository<Clip, UUID> {

    Page<Clip> findByOrderByCreatedAtDesc(Pageable pageable);

    Page<Clip> findByTitleContainingIgnoreCase(String q, Pageable pageable);
}
