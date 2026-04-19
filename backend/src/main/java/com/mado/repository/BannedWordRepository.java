package com.mado.repository;

import com.mado.entity.BannedWord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface BannedWordRepository extends JpaRepository<BannedWord, UUID> {

    List<BannedWord> findByChannelId(UUID channelId);

    void deleteByChannelIdAndWordIgnoreCase(UUID channelId, String word);
}
