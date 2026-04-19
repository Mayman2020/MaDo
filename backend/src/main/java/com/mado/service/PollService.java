package com.mado.service;

import com.mado.dto.engagement.PollCreateRequest;
import com.mado.entity.Channel;
import com.mado.entity.Poll;
import com.mado.entity.PollOption;
import com.mado.entity.User;
import com.mado.exception.BadRequestException;
import com.mado.exception.NotFoundException;
import com.mado.repository.PollOptionRepository;
import com.mado.repository.PollRepository;
import com.mado.security.ChannelAuthorizationHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PollService {

    private final PollRepository pollRepository;
    private final PollOptionRepository pollOptionRepository;
    private final ChannelAuthorizationHelper channelAuth;

    @Transactional(readOnly = true)
    public List<Poll> active(String channelUsername) {
        Channel ch = channelAuth.channelByUsername(channelUsername);
        return pollRepository.findByChannel_IdAndStatusOrderByCreatedAtDesc(ch.getId(), "ACTIVE");
    }

    @Transactional
    public Poll create(String channelUsername, PollCreateRequest req, User actor) {
        Channel ch = channelAuth.channelByUsername(channelUsername);
        channelAuth.requireOwnerOrModerator(ch, actor);
        Poll poll = Poll.builder()
                .channel(ch)
                .createdBy(actor)
                .title(req.getTitle())
                .durationSeconds(req.getDurationSeconds() != null ? req.getDurationSeconds() : 60)
                .status("ACTIVE")
                .totalVotes(0)
                .build();
        for (String t : req.getOptionTitles()) {
            PollOption o = PollOption.builder().poll(poll).title(t).voteCount(0).build();
            poll.getOptions().add(o);
        }
        return pollRepository.save(poll);
    }

    @Transactional
    public void vote(String channelUsername, UUID pollId, UUID optionId, User voter) {
        Channel ch = channelAuth.channelByUsername(channelUsername);
        Poll poll = pollRepository.findById(pollId).orElseThrow(() -> new NotFoundException("Poll not found"));
        if (!poll.getChannel().getId().equals(ch.getId())) {
            throw new BadRequestException("Invalid poll");
        }
        if (!"ACTIVE".equals(poll.getStatus())) {
            throw new BadRequestException("Poll closed");
        }
        PollOption opt = pollOptionRepository.findById(optionId).orElseThrow(() -> new NotFoundException("Option"));
        if (!opt.getPoll().getId().equals(poll.getId())) {
            throw new BadRequestException("Invalid option");
        }
        opt.incrementVotes();
        poll.setTotalVotes((poll.getTotalVotes() == null ? 0 : poll.getTotalVotes()) + 1);
        pollOptionRepository.save(opt);
        pollRepository.save(poll);
    }

    @Transactional
    public void end(String channelUsername, UUID pollId, User actor) {
        Channel ch = channelAuth.channelByUsername(channelUsername);
        channelAuth.requireOwnerOrModerator(ch, actor);
        Poll poll = pollRepository.findById(pollId).orElseThrow(() -> new NotFoundException("Poll not found"));
        if (!poll.getChannel().getId().equals(ch.getId())) {
            throw new BadRequestException("Invalid poll");
        }
        poll.setStatus("ENDED");
        poll.setEndedAt(Instant.now());
        pollRepository.save(poll);
    }
}
