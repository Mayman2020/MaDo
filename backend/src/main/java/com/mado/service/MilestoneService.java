package com.mado.service;

import com.mado.entity.Channel;
import com.mado.entity.Milestone;
import com.mado.entity.Payout;
import com.mado.entity.StreamerMilestone;
import com.mado.entity.StreamerTierStatus;
import com.mado.repository.ChannelRepository;
import com.mado.repository.ClipRepository;
import com.mado.repository.MilestoneRepository;
import com.mado.repository.PayoutRepository;
import com.mado.repository.StreamRepository;
import com.mado.repository.StreamerMilestoneRepository;
import com.mado.repository.StreamerTierStatusRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class MilestoneService {

    private final MilestoneRepository        milestoneRepo;
    private final StreamerMilestoneRepository earnedRepo;
    private final StreamerTierStatusRepository statusRepo;
    private final ChannelRepository          channelRepo;
    private final StreamRepository           streamRepo;
    private final ClipRepository             clipRepo;
    private final PayoutRepository           payoutRepo;
    private final SimpMessagingTemplate      messaging;

    public List<Milestone> getAllMilestones() {
        return milestoneRepo.findAllByOrderBySortOrderAsc();
    }

    @Transactional
    public void checkAll() {
        channelRepo.findAll().forEach(ch -> checkChannel(ch.getId()));
    }

    @Transactional
    public void checkChannel(UUID channelId) {
        Channel channel = channelRepo.findById(channelId).orElse(null);
        if (channel == null) return;

        Optional<StreamerTierStatus> statusOpt = statusRepo.findByChannelId(channelId);
        List<UUID> earned = earnedRepo.findEarnedMilestoneIdsByChannelId(channelId);
        List<Milestone> all = milestoneRepo.findAllByOrderBySortOrderAsc();

        long streamCount = streamRepo.countByChannelId(channelId);
        long maxClipViews = clipRepo.findMaxViewCountByChannelId(channelId);

        for (Milestone m : all) {
            if (earned.contains(m.getId())) continue;

            long current = resolveMetric(m.getMetricType(), channel, statusOpt.orElse(null), streamCount, maxClipViews);
            if (current >= m.getMetricValue()) {
                awardMilestone(channel, m);
            }
        }
    }

    private long resolveMetric(String type, Channel channel, StreamerTierStatus status, long streamCount, long maxClipViews) {
        return switch (type) {
            case "total_hours"    -> status == null ? 0 : status.getTotalStreamHours().longValue();
            case "peak_viewers"   -> channel.getPeakViewerCount() == null ? 0 : channel.getPeakViewerCount();
            case "follower_count" -> channel.getFollowerCount() == null ? 0 : channel.getFollowerCount();
            case "sub_count"      -> channel.getSubscriberCount() == null ? 0 : channel.getSubscriberCount();
            case "stream_count"   -> streamCount;
            case "clip_views"     -> maxClipViews;
            default               -> 0;
        };
    }

    @Transactional
    public void awardMilestone(Channel channel, Milestone milestone) {
        if (earnedRepo.existsByChannelIdAndMilestoneId(channel.getId(), milestone.getId())) return;

        StreamerMilestone earned = StreamerMilestone.builder()
                .channel(channel)
                .milestone(milestone)
                .earnedAt(Instant.now())
                .build();
        earnedRepo.save(earned);

        if ("CASH".equals(milestone.getRewardType()) && milestone.getRewardAmount() != null
                && milestone.getRewardAmount().compareTo(BigDecimal.ZERO) > 0) {
            Payout payout = Payout.builder()
                    .channel(channel)
                    .user(channel.getUser())
                    .payoutType("MILESTONE_REWARD")
                    .amountUsd(milestone.getRewardAmount())
                    .status("PENDING")
                    .milestone(milestone)
                    .notes(milestone.getName() + " milestone reward")
                    .build();
            payoutRepo.save(payout);
        }

        // WebSocket notification to streamer dashboard
        messaging.convertAndSend(
                "/topic/dashboard." + channel.getUser().getId() + ".milestone",
                Map.of("type", "MILESTONE_EARNED",
                       "milestone", Map.of(
                           "id",          milestone.getId(),
                           "name",        milestone.getName(),
                           "description", milestone.getDescription(),
                           "rewardType",  milestone.getRewardType() != null ? milestone.getRewardType() : "",
                           "rewardAmount",milestone.getRewardAmount() != null ? milestone.getRewardAmount() : 0,
                           "badgeColor",  milestone.getBadgeColor() != null ? milestone.getBadgeColor() : "#53fc18"
                       )));

        log.info("Channel {} earned milestone: {}", channel.getUser().getUsername(), milestone.getName());
    }

    public List<StreamerMilestone> getEarned(UUID channelId) {
        return earnedRepo.findByChannelIdOrderByEarnedAtDesc(channelId);
    }
}
