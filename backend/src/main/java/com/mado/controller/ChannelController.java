package com.mado.controller;

import com.mado.dto.ChannelPublicResponse;
import com.mado.dto.ChannelStatsResponse;
import com.mado.dto.ChannelUpdateRequest;
import com.mado.dto.ChatSettingsRequest;
import com.mado.dto.ChatSettingsResponse;
import com.mado.dto.LiveStreamResponse;
import com.mado.security.CustomUserDetails;
import com.mado.service.ChannelService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/channels")
@RequiredArgsConstructor
public class ChannelController {

    private final ChannelService channelService;

    @GetMapping("/live")
    public ResponseEntity<Page<LiveStreamResponse>> live(
            @PageableDefault(size = 24) Pageable pageable) {
        return ResponseEntity.ok(channelService.liveChannels(pageable));
    }

    @GetMapping("/{username}")
    public ResponseEntity<ChannelPublicResponse> get(@PathVariable String username) {
        return ResponseEntity.ok(channelService.getByUsername(username));
    }

    @PatchMapping("/{username}")
    public ResponseEntity<ChannelPublicResponse> patch(
            @PathVariable String username,
            @Valid @RequestBody ChannelUpdateRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(channelService.updateChannel(username, request, principal.user()));
    }

    @GetMapping("/{username}/stats")
    public ResponseEntity<ChannelStatsResponse> stats(@PathVariable String username) {
        return ResponseEntity.ok(channelService.stats(username));
    }

    @PostMapping("/{username}/reset-key")
    public ResponseEntity<Map<String, String>> resetKey(
            @PathVariable String username,
            @AuthenticationPrincipal CustomUserDetails principal) {
        String key = channelService.resetStreamKey(username, principal.user());
        return ResponseEntity.ok(Map.of("streamKey", key));
    }

    @GetMapping("/{username}/chat-settings")
    public ResponseEntity<ChatSettingsResponse> getChatSettings(@PathVariable String username) {
        return ResponseEntity.ok(channelService.getChatSettings(username));
    }

    @PatchMapping("/{username}/chat-settings")
    public ResponseEntity<ChatSettingsResponse> updateChatSettings(
            @PathVariable String username,
            @Valid @RequestBody ChatSettingsRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(channelService.updateChatSettings(username, request, principal.user()));
    }

    @GetMapping("/leaderboard")
    public ResponseEntity<Page<ChannelPublicResponse>> leaderboard(
            @RequestParam(defaultValue = "views") String metric,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(channelService.leaderboard(metric, pageable));
    }
}
