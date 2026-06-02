package com.mado.service;

import com.mado.entity.Channel;
import com.mado.entity.Ranking;
import com.mado.repository.ChannelRepository;
import com.mado.repository.RankingRepository;
import com.mado.repository.StreamStatsDailyRepository;
import com.mado.repository.StreamStatsHourlyRepository;
import com.mado.repository.StreamStatsMonthlyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;

@Slf4j
@Service
@RequiredArgsConstructor
public class RankingService {

    private static final String KEY_LIVE        = "rankings:live";
    private static final String KEY_ALLTIME     = "rankings:alltime";

    private final RankingRepository       rankingRepo;
    private final StreamStatsDailyRepository   dailyRepo;
    private final StreamStatsHourlyRepository  hourlyRepo;
    private final StreamStatsMonthlyRepository monthlyRepo;
    private final ChannelRepository       channelRepo;
    private final StringRedisTemplate     redis;

    @Transactional
    public void recalculateAll() {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        calculateDailyViewsRanking(today);
        calculateAllTimeRanking();
        log.info("Rankings recalculated for {}", today);
    }

    @Transactional
    public void calculateDailyViewsRanking(LocalDate date) {
        rankingRepo.deleteByRankingType("DAILY_VIEWS");
        List<com.mado.entity.StreamStatsDaily> rows = dailyRepo.findTopByDate(date);
        Instant start = date.atStartOfDay().toInstant(ZoneOffset.UTC);
        Instant end   = date.plusDays(1).atStartOfDay().toInstant(ZoneOffset.UTC);
        AtomicInteger pos = new AtomicInteger(1);
        List<Ranking> rankings = rows.stream().map(s -> Ranking.builder()
                .channel(s.getChannel())
                .category(s.getCategory())
                .rankingType("DAILY_VIEWS")
                .rankPosition(pos.getAndIncrement())
                .metricValue(s.getTotalViews())
                .periodStart(start)
                .periodEnd(end)
                .calculatedAt(Instant.now())
                .build()).toList();
        rankingRepo.saveAll(rankings);
        // Sync Redis sorted set
        String key = "rankings:daily:" + date;
        try {
            redis.delete(key);
            rows.forEach(s -> redis.opsForZSet().add(key, s.getChannel().getId().toString(), s.getTotalViews()));
        } catch (Exception ignored) {}
    }

    @Transactional
    public void calculateHourlyViewersRanking(Instant hour) {
        rankingRepo.deleteByRankingType("HOURLY_VIEWERS");
        List<com.mado.entity.StreamStatsHourly> rows = hourlyRepo.findTopByHour(hour);
        AtomicInteger pos = new AtomicInteger(1);
        List<Ranking> rankings = rows.stream().map(s -> Ranking.builder()
                .channel(s.getChannel())
                .rankingType("HOURLY_VIEWERS")
                .rankPosition(pos.getAndIncrement())
                .metricValue(s.getViewerCount())
                .periodStart(hour)
                .periodEnd(hour.plus(1, ChronoUnit.HOURS))
                .calculatedAt(Instant.now())
                .build()).toList();
        rankingRepo.saveAll(rankings);
    }

    @Transactional
    public void calculateMonthlyHoursRanking(int year, int month) {
        rankingRepo.deleteByRankingType("MONTHLY_HOURS");
        List<com.mado.entity.StreamStatsMonthly> rows = monthlyRepo.findTopByHours(year, month);
        AtomicInteger pos = new AtomicInteger(1);
        List<Ranking> rankings = rows.stream().map(s -> {
            Instant start = LocalDate.of(year, month, 1).atStartOfDay().toInstant(ZoneOffset.UTC);
            return Ranking.builder()
                    .channel(s.getChannel())
                    .rankingType("MONTHLY_HOURS")
                    .rankPosition(pos.getAndIncrement())
                    .metricValue(s.getTotalHours().longValue())
                    .periodStart(start)
                    .periodEnd(start.plus(31, ChronoUnit.DAYS))
                    .calculatedAt(Instant.now())
                    .build();
        }).toList();
        rankingRepo.saveAll(rankings);
    }

    @Transactional
    public void calculateAllTimeRanking() {
        rankingRepo.deleteByRankingType("ALL_TIME");
        List<Object[]> rows = dailyRepo.findAllTimeTopChannels();
        AtomicInteger pos = new AtomicInteger(1);
        List<Ranking> rankings = new ArrayList<>();
        for (Object[] row : rows) {
            UUID channelId = (UUID) row[0];
            long metric = ((Number) row[1]).longValue();
            channelRepo.findById(channelId).ifPresent(ch -> rankings.add(Ranking.builder()
                    .channel(ch)
                    .rankingType("ALL_TIME")
                    .rankPosition(pos.getAndIncrement())
                    .metricValue(metric)
                    .periodStart(Instant.EPOCH)
                    .periodEnd(Instant.now())
                    .calculatedAt(Instant.now())
                    .build()));
        }
        rankingRepo.saveAll(rankings);
        // Redis
        try {
            redis.delete(KEY_ALLTIME);
            rows.forEach(row -> redis.opsForZSet().add(KEY_ALLTIME,
                    row[0].toString(), ((Number) row[1]).doubleValue()));
        } catch (Exception ignored) {}
    }

    @Transactional
    public void calculateRisingStreamers() {
        rankingRepo.deleteByRankingType("RISING");
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        LocalDate weekAgo = today.minusDays(7);
        LocalDate twoWeeksAgo = today.minusDays(14);

        // For all channels: compare avg of last 7 days vs prior 7 days
        List<Channel> allChannels = channelRepo.findAll();
        record Growth(Channel ch, double pct, long metric) {}
        List<Growth> growths = new ArrayList<>();

        for (Channel ch : allChannels) {
            Instant from1 = weekAgo.atStartOfDay().toInstant(ZoneOffset.UTC);
            Instant from2 = twoWeeksAgo.atStartOfDay().toInstant(ZoneOffset.UTC);
            Instant to1   = today.atStartOfDay().toInstant(ZoneOffset.UTC);
            Double recent = hourlyRepo.avgViewersByChannelAndRange(ch.getId(), from1, to1);
            Double prior  = hourlyRepo.avgViewersByChannelAndRange(ch.getId(), from2, from1);
            if (recent == null || recent < 1) continue;
            double pct = (prior == null || prior < 1)
                    ? recent * 100
                    : ((recent - prior) / prior) * 100;
            if (pct > 0) growths.add(new Growth(ch, pct, recent.longValue()));
        }
        growths.sort((a, b) -> Double.compare(b.pct(), a.pct()));

        AtomicInteger pos = new AtomicInteger(1);
        List<Ranking> rankings = growths.stream().limit(200).map(g -> Ranking.builder()
                .channel(g.ch())
                .rankingType("RISING")
                .rankPosition(pos.getAndIncrement())
                .metricValue((long) g.pct())
                .periodStart(weekAgo.atStartOfDay().toInstant(ZoneOffset.UTC))
                .periodEnd(today.atStartOfDay().toInstant(ZoneOffset.UTC))
                .calculatedAt(Instant.now())
                .build()).toList();
        rankingRepo.saveAll(rankings);
    }

    public List<Ranking> getRankings(String type, UUID categoryId, int page, int size) {
        PageRequest pr = PageRequest.of(page, size);
        if (categoryId == null) {
            return rankingRepo.findByRankingTypeAndCategoryIsNullOrderByRankPositionAsc(type, pr);
        }
        return rankingRepo.findByRankingTypeAndCategoryIdOrderByRankPositionAsc(type, categoryId, pr);
    }

    public Map<String, Integer> getChannelRanks(UUID channelId) {
        List<Ranking> ranks = rankingRepo.findByChannelIdOrderByRankPositionAsc(channelId);
        Map<String, Integer> result = new java.util.HashMap<>();
        ranks.forEach(r -> result.put(r.getRankingType(), r.getRankPosition()));
        return result;
    }

    // Redis live ranking helpers — all fail silently when Redis is unavailable
    public void updateLiveRank(UUID channelId, long viewerCount) {
        try {
            redis.opsForZSet().add(KEY_LIVE, channelId.toString(), viewerCount);
        } catch (Exception ignored) {}
    }

    public void removeLiveRank(UUID channelId) {
        try {
            redis.opsForZSet().remove(KEY_LIVE, channelId.toString());
        } catch (Exception ignored) {}
    }

    public Set<org.springframework.data.redis.core.ZSetOperations.TypedTuple<String>> getLiveTopN(int n) {
        try {
            return redis.opsForZSet().reverseRangeWithScores(KEY_LIVE, 0, n - 1);
        } catch (Exception e) {
            return Set.of();
        }
    }
}
