package com.mado.controller;

import com.mado.dto.StreamHealthResponse;
import com.mado.entity.Channel;
import com.mado.entity.Notification;
import com.mado.entity.Vod;
import com.mado.security.CustomUserDetails;
import com.mado.service.ChannelService;
import com.mado.service.NotificationService;
import com.mado.service.StreamHealthService;
import com.mado.service.VodService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final ChannelService channelService;
    private final NotificationService notificationService;
    private final StreamHealthService streamHealthService;
    private final VodService vodService;

    /** Real-time stats for the streamer's own channel. */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> stats(@AuthenticationPrincipal CustomUserDetails principal) {
        Channel ch = channelService.getOrCreateForUser(principal.user());
        return ResponseEntity.ok(Map.of(
                "isLive", ch.getIsLive() != null && ch.getIsLive(),
                "viewerCount", ch.getViewerCount() != null ? ch.getViewerCount() : 0,
                "followerCount", ch.getFollowerCount() != null ? ch.getFollowerCount() : 0,
                "subscriberCount", ch.getSubscriberCount() != null ? ch.getSubscriberCount() : 0,
                "totalViews", ch.getTotalViews() != null ? ch.getTotalViews() : 0L
        ));
    }

    /** OBS / nginx-rtmp ingest health from the RTMP stat XML page. */
    @GetMapping("/stream-health")
    public ResponseEntity<StreamHealthResponse> streamHealth(@AuthenticationPrincipal CustomUserDetails principal) {
        Channel ch = channelService.getOrCreateForUser(principal.user());
        return ResponseEntity.ok(streamHealthService.forChannel(ch));
    }

    @GetMapping("/vods")
    public ResponseEntity<Page<Vod>> myVods(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PageableDefault(size = 50) Pageable pageable) {
        return ResponseEntity.ok(vodService.listMine(principal.user(), pageable));
    }

    /** Recent activity feed (follows, subs, donations, raids) from the notifications table. */
    @GetMapping("/activity-feed")
    public ResponseEntity<Page<Notification>> activityFeed(
            @AuthenticationPrincipal CustomUserDetails principal,
            @RequestParam(defaultValue = "0") int page) {
        return ResponseEntity.ok(notificationService.mine(principal.user(), PageRequest.of(page, 20)));
    }
}
