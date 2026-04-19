package com.mado.repository;

import com.mado.entity.StreamSchedule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface StreamScheduleRepository extends JpaRepository<StreamSchedule, UUID> {

    List<StreamSchedule> findByChannelIdAndIsCancelledFalseAndScheduledAtAfterOrderByScheduledAtAsc(
            UUID channelId, Instant after);
}
