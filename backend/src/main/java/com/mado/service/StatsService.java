package com.mado.service;

import com.mado.entity.Channel;
import com.mado.entity.StreamStatsDaily;
import com.mado.entity.StreamStatsHourly;
import com.mado.repository.ChannelRepository;
import com.mado.repository.StreamStatsDailyRepository;
import com.mado.repository.StreamStatsHourlyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class StatsService {

    private final ChannelRepository           channelRepo;
    private final StreamStatsDailyRepository  dailyRepo;
    private final StreamStatsHourlyRepository hourlyRepo;
    private final StringRedisTemplate         redis;

    public Map<String, Object> getChannelStats(String username, String period) {
        Channel channel = channelRepo.findByUserUsername(username).orElseThrow();
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        LocalDate from;
        LocalDate to = today;

        from = switch (period) {
            case "TODAY"      -> today;
            case "YESTERDAY"  -> today.minusDays(1);
            case "THIS_WEEK"  -> today.minusDays(6);
            case "THIS_MONTH" -> today.withDayOfMonth(1);
            case "LAST_MONTH" -> today.minusMonths(1).withDayOfMonth(1);
            default           -> LocalDate.of(2020, 1, 1);  // ALL_TIME
        };
        if ("LAST_MONTH".equals(period)) {
            to = today.minusMonths(1).withDayOfMonth(today.minusMonths(1).lengthOfMonth());
        }

        List<StreamStatsDaily> days = dailyRepo
                .findByChannelIdAndStatDateBetweenOrderByStatDateAsc(channel.getId(), from, to);

        long totalViews    = days.stream().mapToLong(StreamStatsDaily::getTotalViews).sum();
        int  peakViewers   = days.stream().mapToInt(StreamStatsDaily::getPeakViewers).max().orElse(0);
        int  avgViewers    = days.isEmpty() ? 0 : (int) days.stream().mapToInt(StreamStatsDaily::getAvgViewers).average().orElse(0);
        int  streamMinutes = days.stream().mapToInt(StreamStatsDaily::getStreamMinutes).sum();
        int  newFollowers  = days.stream().mapToInt(StreamStatsDaily::getNewFollowers).sum();
        int  newSubs       = days.stream().mapToInt(StreamStatsDaily::getNewSubs).sum();

        List<Map<String, Object>> graph = new ArrayList<>();
        for (StreamStatsDaily d : days) {
            graph.add(Map.of("day", d.getStatDate().toString(), "viewers", d.getAvgViewers()));
        }

        Map<String, Object> result = new HashMap<>();
        result.put("totalViews",    totalViews);
        result.put("peakViewers",   peakViewers);
        result.put("avgViewers",    avgViewers);
        result.put("totalHours",    streamMinutes / 60.0);
        result.put("streamCount",   days.size());
        result.put("newFollowers",  newFollowers);
        result.put("newSubs",       newSubs);
        result.put("viewerGraph",   graph);
        return result;
    }

    public List<Map<String, Object>> getHourlyBreakdown(String username, LocalDate date) {
        Channel channel = channelRepo.findByUserUsername(username).orElseThrow();
        Instant dayStart = date.atStartOfDay().toInstant(ZoneOffset.UTC);
        Instant dayEnd   = date.plusDays(1).atStartOfDay().toInstant(ZoneOffset.UTC);

        List<StreamStatsHourly> hours = hourlyRepo
                .findByChannelAndRange(channel.getId(), dayStart, dayEnd);

        Map<Integer, Integer> byHour = new LinkedHashMap<>();
        for (int h = 0; h < 24; h++) byHour.put(h, 0);
        for (StreamStatsHourly h : hours) {
            int hr = h.getSnapshotHour().atZone(ZoneOffset.UTC).getHour();
            byHour.merge(hr, h.getViewerCount(), Math::max);
        }

        List<Map<String, Object>> result = new ArrayList<>();
        byHour.forEach((h, v) -> result.add(Map.of("hour", h, "viewers", v)));
        return result;
    }

    public Map<String, Object> getPlatformStats() {
        long liveCount = channelRepo.countByIsLiveTrue();
        long totalViewersNow = 0;
        Set<org.springframework.data.redis.core.ZSetOperations.TypedTuple<String>> liveSet;
        try {
            liveSet = redis.opsForZSet().reverseRangeWithScores("rankings:live", 0, -1);
        } catch (Exception e) {
            liveSet = null;
        }
        if (liveSet != null) {
            totalViewersNow = liveSet.stream()
                    .mapToLong(t -> t.getScore() == null ? 0 : t.getScore().longValue())
                    .sum();
        }

        Map<String, Object> result = new HashMap<>();
        result.put("liveStreamsNow",   liveCount);
        result.put("totalViewersNow",  totalViewersNow);
        return result;
    }
}
