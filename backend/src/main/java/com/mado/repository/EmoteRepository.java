package com.mado.repository;

import com.mado.entity.Emote;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EmoteRepository extends JpaRepository<Emote, UUID> {

    List<Emote> findByChannelIdAndIsActiveTrue(UUID channelId);

    Optional<Emote> findByCodeAndIsActiveTrue(String code);
}
