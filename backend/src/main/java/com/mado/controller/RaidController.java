package com.mado.controller;

import com.mado.entity.Raid;
import com.mado.security.CustomUserDetails;
import com.mado.service.RaidService;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/channels/{username}/raids")
@RequiredArgsConstructor
public class RaidController {

    private final RaidService raidService;

    @PostMapping
    public ResponseEntity<Raid> start(
            @PathVariable String username,
            @RequestBody StartRaidBody body,
            @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(raidService.start(username, body.getTargetUsername(), body.getViewerCount(), principal.user()));
    }

    @PostMapping("/{raidId}/complete")
    public ResponseEntity<Raid> complete(
            @PathVariable String username,
            @PathVariable UUID raidId,
            @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(raidService.complete(raidId, principal.user()));
    }

    @Getter
    @Setter
    public static class StartRaidBody {
        private String targetUsername;
        private int viewerCount;
    }
}
