package com.mado.repository;

import com.mado.entity.ChatMessage;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {

    List<ChatMessage> findByChannelIdAndIsDeletedFalseOrderByCreatedAtDesc(UUID channelId, Pageable pageable);

    List<ChatMessage> findTop1ByChannelIdAndUser_IdAndIsDeletedFalseOrderByCreatedAtDesc(UUID channelId, UUID userId);
}
