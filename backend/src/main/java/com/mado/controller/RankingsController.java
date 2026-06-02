package com.mado.controller;

import com.mado.entity.Channel;
import com.mado.entity.Ranking;
import com.mado.repository.CategoryRepository;
import com.mado.repository.ChannelRepository;
import com.mado.service.RankingService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.*;

@RestController
@RequestMapping("/api/rankings")
@RequiredArgsConstructor
public class RankingsController {

    private final RankingService      rankingService;
    private final ChannelRepository   channelRepo;
    private final CategoryRepository  categoryRepo;
    private final StringRedisTemplate redis;

    /** GET /api/rankings/live — real-time top by viewer count from Redis */
    @GetMapping("/live")
    public ResponseEntity<List<Map<String, Object>>> live() {
        Set<ZSetOperations.TypedTuple<String>> top =
                rankingService.getLiveTopN(100);
        if (top == null) return ResponseEntity.ok(List.of());

        List<Map<String, Object>> result = new ArrayList<>();
        int rank = 1;
        for (ZSetOperations.TypedTuple<String> entry : top) {
            String channelId = entry.getValue();
            if (channelId == null) continue;
            Optional<Channel> chOpt = channelRepo.findById(UUID.fromString(channelId));
            if (chOpt.isEmpty()) continue;
            Channel ch = chOpt.get();
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("rank",          rank++);
            row.put("channelId",     ch.getId());
            row.put("username",      ch.getUser().getUsername());
            row.put("title",         ch.getTitle());
            row.put("viewerCount",   entry.getScore() == null ? 0 : entry.getScore().intValue());
            row.put("categoryName",  ch.getCategory() != null ? ch.getCategory().getName() : null);
            row.put("categorySlug",  ch.getCategory() != null ? ch.getCategory().getSlug() : null);
            row.put("isLive",        ch.getIsLive());
            row.put("thumbnailUrl",  ch.getThumbnailUrl());
            result.add(row);
        }
        return ResponseEntity.ok(result);
    }

    /** GET /api/rankings/daily */
    @GetMapping("/daily")
    public ResponseEntity<List<Map<String, Object>>> daily(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) String categorySlug,
            @RequestParam(defaultValue = "0") int page) {
        if (date == null) date = LocalDate.now(ZoneOffset.UTC);
        UUID catId = resolveCategoryId(categorySlug);
        List<Ranking> rankings = rankingService.getRankings("DAILY_VIEWS", catId, page, 50);
        return ResponseEntity.ok(toResponse(rankings));
    }

    /** GET /api/rankings/weekly */
    @GetMapping("/weekly")
    public ResponseEntity<List<Map<String, Object>>> weekly(
            @RequestParam(required = false) String categorySlug,
            @RequestParam(defaultValue = "0") int page) {
        UUID catId = resolveCategoryId(categorySlug);
        List<Ranking> rankings = rankingService.getRankings("DAILY_VIEWS", catId, page, 50);
        return ResponseEntity.ok(toResponse(rankings));
    }

    /** GET /api/rankings/monthly */
    @GetMapping("/monthly")
    public ResponseEntity<List<Map<String, Object>>> monthly(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) String categorySlug,
            @RequestParam(defaultValue = "0") int page) {
        UUID catId = resolveCategoryId(categorySlug);
        List<Ranking> rankings = rankingService.getRankings("MONTHLY_HOURS", catId, page, 50);
        return ResponseEntity.ok(toResponse(rankings));
    }

    /** GET /api/rankings/alltime */
    @GetMapping("/alltime")
    public ResponseEntity<List<Map<String, Object>>> allTime(
            @RequestParam(required = false) String categorySlug,
            @RequestParam(defaultValue = "0") int page) {
        UUID catId = resolveCategoryId(categorySlug);
        List<Ranking> rankings = rankingService.getRankings("ALL_TIME", catId, page, 50);
        return ResponseEntity.ok(toResponse(rankings));
    }

    /** GET /api/rankings/hours */
    @GetMapping("/hours")
    public ResponseEntity<List<Map<String, Object>>> hours(
            @RequestParam(defaultValue = "monthly") String period,
            @RequestParam(defaultValue = "0") int page) {
        List<Ranking> rankings = rankingService.getRankings("MONTHLY_HOURS", null, page, 50);
        return ResponseEntity.ok(toResponse(rankings));
    }

    /** GET /api/rankings/rising */
    @GetMapping("/rising")
    public ResponseEntity<List<Map<String, Object>>> rising(
            @RequestParam(defaultValue = "0") int page) {
        List<Ranking> rankings = rankingService.getRankings("RISING", null, page, 50);
        return ResponseEntity.ok(toResponse(rankings));
    }

    /** GET /api/rankings/channel/:username */
    @GetMapping("/channel/{username}")
    public ResponseEntity<Map<String, Object>> channelRanks(@PathVariable String username) {
        Channel ch = channelRepo.findByUserUsername(username).orElse(null);
        if (ch == null) return ResponseEntity.notFound().build();
        Map<String, Integer> ranks = rankingService.getChannelRanks(ch.getId());
        return ResponseEntity.ok(Map.of("channelId", ch.getId(), "ranks", ranks));
    }

    // ─── helpers ───────────────────────────────────────────────────────────────

    private UUID resolveCategoryId(String slug) {
        if (slug == null || slug.isBlank()) return null;
        return categoryRepo.findBySlug(slug).map(c -> c.getId()).orElse(null);
    }

    private List<Map<String, Object>> toResponse(List<Ranking> rankings) {
        List<Map<String, Object>> result = new ArrayList<>();
        for (Ranking r : rankings) {
            Channel ch = r.getChannel();
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("rank",         r.getRankPosition());
            row.put("channelId",    ch.getId());
            row.put("username",     ch.getUser().getUsername());
            row.put("title",        ch.getTitle());
            row.put("metricValue",  r.getMetricValue());
            row.put("rankingType",  r.getRankingType());
            row.put("isLive",       ch.getIsLive());
            row.put("viewerCount",  ch.getViewerCount());
            row.put("categoryName", ch.getCategory() != null ? ch.getCategory().getName() : null);
            row.put("thumbnailUrl", ch.getThumbnailUrl());
            row.put("followerCount",ch.getFollowerCount());
            result.add(row);
        }
        return result;
    }
}
