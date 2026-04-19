package com.mado.controller;

import com.mado.entity.Notification;
import com.mado.security.CustomUserDetails;
import com.mado.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<Page<Notification>> list(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PageableDefault(size = 30) Pageable pageable) {
        return ResponseEntity.ok(notificationService.mine(principal.user(), pageable));
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<Void> read(
            @PathVariable UUID id,
            @AuthenticationPrincipal CustomUserDetails principal) {
        notificationService.markRead(principal.user(), id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/read-all")
    public ResponseEntity<Void> readAll(@AuthenticationPrincipal CustomUserDetails principal) {
        notificationService.markAllRead(principal.user());
        return ResponseEntity.noContent().build();
    }
}
