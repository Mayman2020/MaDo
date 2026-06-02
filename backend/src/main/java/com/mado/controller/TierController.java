package com.mado.controller;

import com.mado.entity.Channel;
import com.mado.entity.StreamerTier;
import com.mado.entity.StreamerTierStatus;
import com.mado.entity.User;
import com.mado.repository.ChannelRepository;
import com.mado.service.TierService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/tiers")
@RequiredArgsConstructor
public class TierController {

    private final TierService       tierService;
    private final ChannelRepository channelRepo;

    /** GET /api/tiers — all tier definitions */
    @GetMapping
    public ResponseEntity<List<StreamerTier>> all() {
        return ResponseEntity.ok(tierService.getAllTiers());
    }

    /** GET /api/tiers/my-progress [Auth] */
    @GetMapping("/my-progress")
    public ResponseEntity<Map<String, Object>> myProgress(
            @AuthenticationPrincipal UserDetails principal) {
        Channel ch = channelRepo.findByUserUsername(principal.getUsername()).orElse(null);
        if (ch == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(tierService.getCurrentProgress(ch.getId()));
    }

    /** GET /api/tiers/:channelUsername — public */
    @GetMapping("/{channelUsername}")
    public ResponseEntity<Map<String, Object>> channelTier(@PathVariable String channelUsername) {
        Channel ch = channelRepo.findByUserUsername(channelUsername).orElse(null);
        if (ch == null) return ResponseEntity.notFound().build();
        StreamerTierStatus status = tierService.getOrCreateStatus(ch.getId());
        StreamerTier tier = status.getCurrentTier();
        if (tier == null) return ResponseEntity.ok(Map.of("tier", "NONE"));
        return ResponseEntity.ok(Map.of(
                "name",        tier.getName(),
                "displayName", tier.getDisplayName(),
                "badgeColor",  tier.getBadgeColor() != null ? tier.getBadgeColor() : "#53fc18",
                "badgeIcon",   tier.getBadgeIcon() != null ? tier.getBadgeIcon() : "",
                "revenueSplit", tier.getRevenueSplit()
        ));
    }
}
