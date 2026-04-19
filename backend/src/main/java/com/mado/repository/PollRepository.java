package com.mado.repository;

import com.mado.entity.Poll;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PollRepository extends JpaRepository<Poll, UUID> {

    List<Poll> findByChannel_IdAndStatusOrderByCreatedAtDesc(UUID channelId, String status);
}
