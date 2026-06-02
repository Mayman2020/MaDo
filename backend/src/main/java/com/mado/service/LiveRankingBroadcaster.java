package com.mado.service;

import com.mado.entity.Channel;
import com.mado.repository.ChannelRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
public class LiveRankingBroadcaster {

    private final StringRedisTemplate redis;
    private final SimpMessagingTemplate messaging;
    private final ChannelRepository channelRepo;

    private final Map<UUID, Integer> previousRanks = new HashMap<>();

    /** Every 30 seconds — broadcast live top-20 via WebSocket */
    @Scheduled(fixedRate = 30_000)
    public void broadcastLiveRankings() {
        Set<ZSetOperations.TypedTuple<String>> top;
        try {
            top = redis.opsForZSet().reverseRangeWithScores("rankings:live", 0, 19);
        } catch (Exception e) {
            return; // Redis not available — skip silently
        }
        if (top == null) return;

        List<Map<String, Object>> payload = new ArrayList<>();
        int rank = 1;
        for (ZSetOperations.TypedTuple<String> entry : top) {
            String channelId = entry.getValue();
            if (channelId == null) continue;
            try {
                UUID id = UUID.fromString(channelId);
                Optional<Channel> chOpt = channelRepo.findById(id);
                if (chOpt.isEmpty()) continue;
                Channel ch = chOpt.get();

                int viewers = entry.getScore() == null ? 0 : entry.getScore().intValue();
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("rank",          rank);
                row.put("channelId",     id);
                row.put("username",      ch.getUser().getUsername());
                row.put("title",         ch.getTitle());
                row.put("viewerCount",   viewers);
                row.put("categoryName",  ch.getCategory() != null ? ch.getCategory().getName() : null);
                row.put("thumbnailUrl",  ch.getThumbnailUrl());
                payload.add(row);

                // Check for significant rank change (±5 positions)
                Integer prev = previousRanks.get(id);
                if (prev != null && Math.abs(prev - rank) >= 5) {
                    messaging.convertAndSend(
                            "/topic/channel." + id + ".rank-update",
                            Map.of("rank", rank, "change", prev - rank,
                                   "message", "Channel moved to #" + rank));
                }
                previousRanks.put(id, rank);
                rank++;
            } catch (Exception ignored) {}
        }
        messaging.convertAndSend("/topic/rankings.live", payload);
    }
}
