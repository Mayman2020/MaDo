package com.mado.controller;

import com.mado.entity.Channel;
import com.mado.entity.Milestone;
import com.mado.entity.StreamerMilestone;
import com.mado.entity.StreamerTierStatus;
import com.mado.repository.ChannelRepository;
import com.mado.repository.StreamerTierStatusRepository;
import com.mado.service.MilestoneService;
import com.mado.service.TierService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/milestones")
@RequiredArgsConstructor
public class MilestoneController {

    private final MilestoneService          milestoneService;
    private final TierService               tierService;
    private final ChannelRepository         channelRepo;
    private final StreamerTierStatusRepository statusRepo;

    /** GET /api/milestones — all milestone definitions */
    @GetMapping
    public ResponseEntity<List<Milestone>> all() {
        return ResponseEntity.ok(milestoneService.getAllMilestones());
    }

    /** GET /api/milestones/my [Auth] — earned + progress + locked */
    @GetMapping("/my")
    public ResponseEntity<Map<String, Object>> my(
            @AuthenticationPrincipal UserDetails principal) {
        Channel ch = channelRepo.findByUserUsername(principal.getUsername()).orElse(null);
        if (ch == null) return ResponseEntity.notFound().build();

        List<StreamerMilestone> earned   = milestoneService.getEarned(ch.getId());
        Set<UUID> earnedIds = new HashSet<>();
        earned.forEach(e -> earnedIds.add(e.getMilestone().getId()));

        List<Milestone> all = milestoneService.getAllMilestones();
        StreamerTierStatus status = tierService.getOrCreateStatus(ch.getId());

        List<Map<String, Object>> inProgress = new ArrayList<>();
        List<Milestone> locked = new ArrayList<>();

        long totalStreamHours = status.getTotalStreamHours().longValue();
        long followerCount    = ch.getFollowerCount();
        long subCount         = ch.getSubscriberCount();

        for (Milestone m : all) {
            if (earnedIds.contains(m.getId())) continue;

            long current = estimateCurrent(m.getMetricType(), ch, totalStreamHours);
            long target  = m.getMetricValue();
            double pct   = target == 0 ? 100 : Math.min(100.0, current * 100.0 / target);

            if (pct > 0) {
                inProgress.add(Map.of(
                        "milestone",    m,
                        "currentValue", current,
                        "targetValue",  target,
                        "percentage",   (int) pct));
            } else {
                locked.add(m);
            }
        }

        return ResponseEntity.ok(Map.of(
                "earned",     earned,
                "inProgress", inProgress,
                "locked",     locked,
                "summary", Map.of(
                        "totalEarned",  earned.size(),
                        "totalMilestones", all.size()
                )
        ));
    }

    /** GET /api/milestones/:channelUsername — public earned badges */
    @GetMapping("/{channelUsername}")
    public ResponseEntity<List<StreamerMilestone>> channelMilestones(
            @PathVariable String channelUsername) {
        Channel ch = channelRepo.findByUserUsername(channelUsername).orElse(null);
        if (ch == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(milestoneService.getEarned(ch.getId()));
    }

    private long estimateCurrent(String metricType, Channel ch, long totalHours) {
        return switch (metricType) {
            case "total_hours"    -> totalHours;
            case "follower_count" -> ch.getFollowerCount() == null ? 0 : ch.getFollowerCount();
            case "sub_count"      -> ch.getSubscriberCount() == null ? 0 : ch.getSubscriberCount();
            case "peak_viewers"   -> ch.getPeakViewerCount() == null ? 0 : ch.getPeakViewerCount();
            default               -> 0;
        };
    }
}
