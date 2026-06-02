package com.mado.service;

import com.mado.entity.Channel;
import com.mado.entity.StreamerTier;
import com.mado.entity.StreamerTierStatus;
import com.mado.repository.ChannelRepository;
import com.mado.repository.StreamStatsMonthlyRepository;
import com.mado.repository.StreamerTierRepository;
import com.mado.repository.StreamerTierStatusRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class TierService {

    private final StreamerTierRepository      tierRepo;
    private final StreamerTierStatusRepository statusRepo;
    private final StreamStatsMonthlyRepository monthlyRepo;
    private final ChannelRepository           channelRepo;
    private final SimpMessagingTemplate       messaging;

    public List<StreamerTier> getAllTiers() {
        return tierRepo.findAllByOrderBySortOrderAsc();
    }

    @Transactional
    public void recalculateAll() {
        channelRepo.findAll().forEach(ch -> recalculateChannelTier(ch.getId()));
    }

    @Transactional
    public void recalculateChannelTier(UUID channelId) {
        Channel channel = channelRepo.findById(channelId).orElse(null);
        if (channel == null) return;

        YearMonth now = YearMonth.now(ZoneOffset.UTC);
        Optional<com.mado.entity.StreamStatsMonthly> monthly =
                monthlyRepo.findByChannelIdAndStatYearAndStatMonth(channelId, now.getYear(), now.getMonthValue());

        long followerCount = channel.getFollowerCount();
        BigDecimal hoursThisMonth = monthly.map(com.mado.entity.StreamStatsMonthly::getTotalHours).orElse(BigDecimal.ZERO);
        int avgViewers = monthly.map(com.mado.entity.StreamStatsMonthly::getAvgViewers).orElse(0);

        List<StreamerTier> tiers = tierRepo.findAllByOrderBySortOrderAsc();
        StreamerTier bestTier = tiers.get(0); // default bronze
        for (StreamerTier t : tiers) {
            if (hoursThisMonth.doubleValue() >= t.getMinHoursMonthly()
                    && avgViewers >= t.getMinAvgViewers()
                    && followerCount >= t.getMinFollowers()) {
                bestTier = t;
            }
        }

        StreamerTierStatus status = statusRepo.findByChannelId(channelId)
                .orElse(StreamerTierStatus.builder().channel(channel).build());

        StreamerTier oldTier = status.getCurrentTier();
        if (oldTier == null || !oldTier.getId().equals(bestTier.getId())) {
            status.setPreviousTier(oldTier);
            status.setCurrentTier(bestTier);
            status.setTierAchievedAt(Instant.now());
            status.setTierExpiresAt(Instant.now().plus(62, ChronoUnit.DAYS));
            statusRepo.save(status);

            if (oldTier != null) {
                boolean upgraded = bestTier.getSortOrder() > oldTier.getSortOrder();
                String msgType = upgraded ? "TIER_UPGRADED" : "TIER_DOWNGRADED";
                messaging.convertAndSend(
                        "/topic/dashboard." + channel.getUser().getId() + ".tier-change",
                        Map.of("type", msgType,
                               "from", oldTier.getName(),
                               "to",   bestTier.getName(),
                               "bonus","$" + bestTier.getMonthlyBonusUsd()));
                log.info("Channel {} tier {} → {}", channel.getUser().getUsername(), oldTier.getName(), bestTier.getName());
            }
        }

        // Sync revenue split on channel (if field exists)
        statusRepo.save(status);
    }

    public StreamerTierStatus getOrCreateStatus(UUID channelId) {
        Channel channel = channelRepo.findById(channelId).orElseThrow();
        return statusRepo.findByChannelId(channelId).orElseGet(() -> {
            List<StreamerTier> tiers = tierRepo.findAllByOrderBySortOrderAsc();
            StreamerTierStatus s = StreamerTierStatus.builder()
                    .channel(channel)
                    .currentTier(tiers.isEmpty() ? null : tiers.get(0))
                    .hoursThisMonth(BigDecimal.ZERO)
                    .build();
            return statusRepo.save(s);
        });
    }

    public Map<String, Object> getCurrentProgress(UUID channelId) {
        StreamerTierStatus status = getOrCreateStatus(channelId);
        List<StreamerTier> tiers = tierRepo.findAllByOrderBySortOrderAsc();
        Channel channel = channelRepo.findById(channelId).orElseThrow();

        StreamerTier current = status.getCurrentTier();
        StreamerTier next = null;
        if (current != null) {
            for (StreamerTier t : tiers) {
                if (t.getSortOrder() > current.getSortOrder()) {
                    next = t;
                    break;
                }
            }
        }

        double hours = status.getHoursThisMonth() == null ? 0 : status.getHoursThisMonth().doubleValue();
        int avgV  = status.getAvgViewersThisMonth();
        long followers = channel.getFollowerCount();

        Map<String, Object> result = new HashMap<>();
        result.put("currentTier", current);
        result.put("nextTier", next);

        if (next != null) {
            result.put("progress", Map.of(
                "hoursThisMonth", Map.of(
                    "current", hours,
                    "required", next.getMinHoursMonthly(),
                    "percentage", Math.min(100, (int)(hours / Math.max(1, next.getMinHoursMonthly()) * 100))),
                "avgViewers", Map.of(
                    "current", avgV,
                    "required", next.getMinAvgViewers(),
                    "percentage", next.getMinAvgViewers() == 0 ? 100 : Math.min(100, (int)((double)avgV / next.getMinAvgViewers() * 100))),
                "followers", Map.of(
                    "current", followers,
                    "required", next.getMinFollowers(),
                    "percentage", next.getMinFollowers() == 0 ? 100 : Math.min(100, (int)((double)followers / next.getMinFollowers() * 100)))
            ));

            LocalDate endOfMonth = LocalDate.now(ZoneOffset.UTC).withDayOfMonth(
                LocalDate.now(ZoneOffset.UTC).lengthOfMonth());
            long daysLeft = LocalDate.now(ZoneOffset.UTC).until(endOfMonth, ChronoUnit.DAYS) + 1;
            result.put("daysLeftInMonth", daysLeft);

            // Simple projection
            double hoursPerDay = daysLeft > 0 ? hours / (LocalDate.now(ZoneOffset.UTC).getDayOfMonth()) : 0;
            double projectedHours = hours + hoursPerDay * daysLeft;
            boolean onTrack = projectedHours >= next.getMinHoursMonthly()
                    && avgV >= next.getMinAvgViewers()
                    && followers >= next.getMinFollowers();
            result.put("projectedTier", onTrack
                    ? next.getDisplayName() + " (on track! keep streaming!)"
                    : "Need " + String.format("%.1f", Math.max(0, next.getMinHoursMonthly() - hours)) + " more hours this month");
        }

        result.put("totalStreamHours", status.getTotalStreamHours());
        return result;
    }
}
