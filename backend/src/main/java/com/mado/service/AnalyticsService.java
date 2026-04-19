package com.mado.service;

import com.mado.entity.AnalyticsSnapshot;
import com.mado.entity.Stream;
import com.mado.entity.User;
import com.mado.repository.AnalyticsSnapshotRepository;
import com.mado.repository.StreamRepository;
import com.mado.security.ChannelAuthorizationHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final AnalyticsSnapshotRepository analyticsSnapshotRepository;
    private final StreamRepository streamRepository;
    private final ChannelAuthorizationHelper channelAuth;

    @Transactional(readOnly = true)
    public List<AnalyticsSnapshot> snapshotsForStream(UUID streamId, User viewer) {
        Stream s = streamRepository.findById(streamId).orElseThrow(() -> new com.mado.exception.NotFoundException("Stream not found"));
        channelAuth.requireOwnerOrModerator(s.getChannel(), viewer);
        return analyticsSnapshotRepository.findByStreamIdOrderBySnapshotAtAsc(streamId);
    }

    @Transactional
    public AnalyticsSnapshot record(UUID streamId, AnalyticsSnapshot snap, User actor) {
        Stream s = streamRepository.findById(streamId).orElseThrow(() -> new com.mado.exception.NotFoundException("Stream not found"));
        channelAuth.requireOwnerOrModerator(s.getChannel(), actor);
        snap.setStream(s);
        snap.setChannel(s.getChannel());
        return analyticsSnapshotRepository.save(snap);
    }
}
