package com.mado.service;

import com.mado.entity.Category;
import com.mado.entity.Channel;
import com.mado.entity.StreamSchedule;
import com.mado.entity.User;
import com.mado.repository.CategoryRepository;
import com.mado.repository.StreamScheduleRepository;
import com.mado.security.ChannelAuthorizationHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class StreamScheduleService {

    private final StreamScheduleRepository scheduleRepository;
    private final CategoryRepository categoryRepository;
    private final ChannelAuthorizationHelper channelAuth;

    @Transactional(readOnly = true)
    public List<StreamSchedule> upcoming(String username) {
        Channel ch = channelAuth.channelByUsername(username);
        return scheduleRepository.findByChannelIdAndIsCancelledFalseAndScheduledAtAfterOrderByScheduledAtAsc(
                ch.getId(), Instant.now());
    }

    @Transactional
    public StreamSchedule create(String username, StreamSchedule body, User actor) {
        Channel ch = channelAuth.channelByUsername(username);
        channelAuth.requireOwnerOrModerator(ch, actor);
        body.setChannel(ch);
        if (body.getCategory() != null && body.getCategory().getId() != null) {
            Category cat = categoryRepository.findById(body.getCategory().getId()).orElse(null);
            body.setCategory(cat);
        }
        return scheduleRepository.save(body);
    }

    @Transactional
    public void cancel(String username, UUID scheduleId, User actor) {
        Channel ch = channelAuth.channelByUsername(username);
        channelAuth.requireOwnerOrModerator(ch, actor);
        StreamSchedule s = scheduleRepository.findById(scheduleId).orElseThrow(() -> new com.mado.exception.NotFoundException("Schedule not found"));
        if (!s.getChannel().getId().equals(ch.getId())) {
            throw new com.mado.exception.BadRequestException("Invalid schedule");
        }
        s.setIsCancelled(true);
        scheduleRepository.save(s);
    }
}
