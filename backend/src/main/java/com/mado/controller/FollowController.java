package com.mado.controller;

import com.mado.dto.ChannelPublicResponse;
import com.mado.dto.LiveStreamResponse;
import com.mado.security.CustomUserDetails;
import com.mado.service.FollowService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/follows")
@RequiredArgsConstructor
public class FollowController {

    private final FollowService followService;

    @PostMapping("/{channelId}")
    public ResponseEntity<Void> follow(
            @PathVariable UUID channelId,
            @AuthenticationPrincipal CustomUserDetails principal) {
        followService.follow(channelId, principal.user());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{channelId}")
    public ResponseEntity<Void> unfollow(
            @PathVariable UUID channelId,
            @AuthenticationPrincipal CustomUserDetails principal) {
        followService.unfollow(channelId, principal.user());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/following")
    public ResponseEntity<List<ChannelPublicResponse>> following(
            @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(followService.following(principal.user()));
    }

    @GetMapping("/live")
    public ResponseEntity<Page<LiveStreamResponse>> liveFollowing(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PageableDefault(size = 24) Pageable pageable) {
        return ResponseEntity.ok(followService.liveFollowing(principal.user(), pageable));
    }
}
