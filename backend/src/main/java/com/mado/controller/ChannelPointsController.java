package com.mado.controller;

import com.mado.entity.ChannelPoint;
import com.mado.entity.ChannelPointReward;
import com.mado.entity.PointRedemption;
import com.mado.security.CustomUserDetails;
import com.mado.service.ChannelPointsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/channels/{username}/points")
@RequiredArgsConstructor
public class ChannelPointsController {

    private final ChannelPointsService channelPointsService;

    @GetMapping("/balance")
    public ResponseEntity<ChannelPoint> balance(
            @PathVariable String username,
            @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(channelPointsService.balance(username, principal.user()));
    }

    @GetMapping("/rewards")
    public ResponseEntity<List<ChannelPointReward>> rewards(@PathVariable String username) {
        return ResponseEntity.ok(channelPointsService.rewards(username));
    }

    @PostMapping("/rewards")
    public ResponseEntity<ChannelPointReward> createReward(
            @PathVariable String username,
            @RequestBody ChannelPointReward body,
            @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(channelPointsService.createReward(username, body, principal.user()));
    }

    @PostMapping("/rewards/{rewardId}/redeem")
    public ResponseEntity<PointRedemption> redeem(
            @PathVariable String username,
            @PathVariable UUID rewardId,
            @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(channelPointsService.redeem(username, rewardId, principal.user()));
    }
}
