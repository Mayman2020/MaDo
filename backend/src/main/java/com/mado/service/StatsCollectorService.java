package com.mado.service;

import com.mado.entity.Channel;
import com.mado.entity.Stream;
import com.mado.entity.StreamStatsDaily;
import com.mado.entity.StreamStatsHourly;
import com.mado.entity.StreamerTierStatus;
import com.mado.repository.ChannelRepository;
import com.mado.repository.StreamRepository;
import com.mado.repository.StreamStatsDailyRepository;
import com.mado.repository.StreamStatsHourlyRepository;
import com.mado.repository.StreamStatsMonthlyRepository;
import com.mado.repository.StreamerTierStatusRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class StatsCollectorService {

    private final ChannelRepository           channelRepo;
    private final StreamRepository            streamRepo;
    private final StreamStatsHourlyRepository hourlyRepo;
    private final StreamStatsDailyRepository  dailyRepo;
    private final StreamStatsMonthlyRepository monthlyRepo;
    private final StreamerTierStatusRepository tierStatusRepo;
    private final RankingService              rankingService;
    private final MilestoneService            milestoneService;
    private final TierService                 tierService;
    private final StringRedisTemplate         redis;

    /** Every 1 minute — update hourly stats for live streams */
    @Scheduled(fixedRate = 60_000)
    @Transactional
    public void collectLiveStats() {
        Instant currentHour = Instant.now().truncatedTo(ChronoUnit.HOURS);
        List<Stream> liveStreams = streamRepo.findAllLiveStreams();

        for (Stream stream : liveStreams) {
            Channel channel = stream.getChannel();
            UUID channelId  = channel.getId();

            String viewerKey = "viewers:" + channelId;
            String raw;
            try {
                raw = redis.opsForValue().get(viewerKey);
            } catch (Exception e) {
                raw = null; // Redis not available
            }
            int viewers = raw == null ? 0 : Integer.parseInt(raw);

            StreamStatsHourly hourly = hourlyRepo
                    .findByChannelIdAndSnapshotHour(channelId, currentHour)
                    .orElse(StreamStatsHourly.builder()
                            .channel(channel)
                            .stream(stream)
                            .category(channel.getCategory())
                            .snapshotHour(currentHour)
                            .build());

            hourly.setViewerCount(Math.max(hourly.getViewerCount(), viewers));
            hourly.setPeakViewers(Math.max(hourly.getPeakViewers(), viewers));
            hourlyRepo.save(hourly);

            // Update live rankings Redis sorted set
            try {
                rankingService.updateLiveRank(channelId, viewers);
            } catch (Exception ignored) {}
        }
    }

    /** Every 5 minutes — update avg viewers in tier status */
    @Scheduled(fixedRate = 300_000)
    @Transactional
    public void updateAvgViewers() {
        List<Stream> liveStreams = streamRepo.findAllLiveStreams();
        YearMonth ym = YearMonth.now(ZoneOffset.UTC);
        Instant monthStart = ym.atDay(1).atStartOfDay().toInstant(ZoneOffset.UTC);
        Instant now = Instant.now();

        for (Stream stream : liveStreams) {
            UUID channelId = stream.getChannel().getId();
            Double avg = hourlyRepo.avgViewersByChannelAndRange(channelId, monthStart, now);
            if (avg == null) continue;

            StreamerTierStatus status = tierStatusRepo.findByChannelId(channelId)
                    .orElse(null);
            if (status == null) continue;
            status.setAvgViewersThisMonth((int) Math.round(avg));
            tierStatusRepo.save(status);
        }
    }

    /** Every day at 00:01 — aggregate daily stats + rankings + milestones */
    @Scheduled(cron = "0 1 0 * * *")
    @Transactional
    public void dailyAggregation() {
        LocalDate yesterday = LocalDate.now(ZoneOffset.UTC).minusDays(1);
        log.info("Running daily aggregation for {}", yesterday);

        Instant dayStart = yesterday.atStartOfDay().toInstant(ZoneOffset.UTC);
        Instant dayEnd   = yesterday.plusDays(1).atStartOfDay().toInstant(ZoneOffset.UTC);

        List<Channel> allChannels = channelRepo.findAll();
        for (Channel channel : allChannels) {
            UUID channelId = channel.getId();
            List<StreamStatsHourly> hours = hourlyRepo
                    .findByChannelAndRange(channelId, dayStart, dayEnd);
            if (hours.isEmpty()) continue;

            int peakViewers = hours.stream().mapToInt(StreamStatsHourly::getPeakViewers).max().orElse(0);
            int avgViewers  = (int) hours.stream().mapToInt(StreamStatsHourly::getViewerCount).average().orElse(0);
            int chatMsgs    = hours.stream().mapToInt(StreamStatsHourly::getChatMessages).sum();
            int newFollowers = hours.stream().mapToInt(StreamStatsHourly::getNewFollowers).sum();

            StreamStatsDaily daily = dailyRepo
                    .findByChannelIdAndStatDate(channelId, yesterday)
                    .orElse(StreamStatsDaily.builder()
                            .channel(channel)
                            .statDate(yesterday)
                            .build());

            daily.setTotalViews(channel.getTotalViews());
            daily.setPeakViewers(peakViewers);
            daily.setAvgViewers(avgViewers);
            daily.setStreamMinutes(hours.size() * 60);
            daily.setNewFollowers(newFollowers);
            daily.setChatMessages(chatMsgs);
            daily.setCategory(channel.getCategory());
            dailyRepo.save(daily);

            // Update total hours in tier status
            tierStatusRepo.findByChannelId(channelId).ifPresent(status -> {
                BigDecimal addedHours = BigDecimal.valueOf(hours.size());
                status.setTotalStreamHours(status.getTotalStreamHours().add(addedHours));
                status.setHoursThisMonth(status.getHoursThisMonth().add(addedHours));
                status.setStreamsThisMonth(status.getStreamsThisMonth() + 1);
                status.setPeakViewersThisMonth(Math.max(status.getPeakViewersThisMonth(), peakViewers));
                tierStatusRepo.save(status);
            });
        }

        rankingService.recalculateAll();
        milestoneService.checkAll();
        log.info("Daily aggregation complete for {}", yesterday);
    }

    /** 1st of every month at 01:00 — monthly aggregation + tiers + bonuses */
    @Scheduled(cron = "0 0 1 1 * *")
    @Transactional
    public void monthlyAggregation() {
        YearMonth prev = YearMonth.now(ZoneOffset.UTC).minusMonths(1);
        log.info("Running monthly aggregation for {}/{}", prev.getYear(), prev.getMonthValue());

        LocalDate monthStart = prev.atDay(1);
        LocalDate monthEnd   = prev.atEndOfMonth();

        List<Channel> allChannels = channelRepo.findAll();
        for (Channel channel : allChannels) {
            UUID channelId = channel.getId();
            List<StreamStatsDaily> days = dailyRepo
                    .findByChannelIdAndStatDateBetweenOrderByStatDateAsc(channelId, monthStart, monthEnd);
            if (days.isEmpty()) continue;

            long totalViews = days.stream().mapToLong(StreamStatsDaily::getTotalViews).sum();
            int  peakV      = days.stream().mapToInt(StreamStatsDaily::getPeakViewers).max().orElse(0);
            int  avgV       = (int) days.stream().mapToInt(StreamStatsDaily::getAvgViewers).average().orElse(0);
            int  totalMins  = days.stream().mapToInt(StreamStatsDaily::getStreamMinutes).sum();
            int  newF       = days.stream().mapToInt(StreamStatsDaily::getNewFollowers).sum();

            var monthly = monthlyRepo
                    .findByChannelIdAndStatYearAndStatMonth(channelId, prev.getYear(), prev.getMonthValue())
                    .orElse(com.mado.entity.StreamStatsMonthly.builder()
                            .channel(channel).statYear(prev.getYear()).statMonth(prev.getMonthValue()).build());

            monthly.setTotalViews(totalViews);
            monthly.setPeakViewers(peakV);
            monthly.setAvgViewers(avgV);
            monthly.setTotalHours(BigDecimal.valueOf(totalMins / 60.0));
            monthly.setStreamCount(days.size());
            monthly.setNewFollowers(newF);
            monthly.setCategory(channel.getCategory());
            monthlyRepo.save(monthly);
        }

        tierService.recalculateAll();
        log.info("Monthly aggregation complete");
    }
}
