package com.mado.controller;

import com.mado.entity.AnalyticsSnapshot;
import com.mado.security.CustomUserDetails;
import com.mado.service.AnalyticsService;
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
@RequestMapping("/api/streams/{streamId}/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/snapshots")
    public ResponseEntity<List<AnalyticsSnapshot>> list(
            @PathVariable UUID streamId,
            @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(analyticsService.snapshotsForStream(streamId, principal.user()));
    }

    @PostMapping("/snapshots")
    public ResponseEntity<AnalyticsSnapshot> append(
            @PathVariable UUID streamId,
            @RequestBody AnalyticsSnapshot body,
            @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(analyticsService.record(streamId, body, principal.user()));
    }
}
