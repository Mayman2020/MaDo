package com.mado.repository;

import com.mado.entity.UserPreferences;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface UserPreferencesRepository extends JpaRepository<UserPreferences, UUID> {

    Optional<UserPreferences> findByUser_Id(UUID userId);
}
