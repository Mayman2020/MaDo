package com.mado.controller;

import com.mado.entity.StreamSchedule;
import com.mado.security.CustomUserDetails;
import com.mado.service.StreamScheduleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/channels/{username}/schedules")
@RequiredArgsConstructor
public class StreamScheduleController {

    private final StreamScheduleService streamScheduleService;

    @GetMapping
    public ResponseEntity<List<StreamSchedule>> upcoming(@PathVariable String username) {
        return ResponseEntity.ok(streamScheduleService.upcoming(username));
    }

    @PostMapping
    public ResponseEntity<StreamSchedule> create(
            @PathVariable String username,
            @RequestBody StreamSchedule body,
            @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(streamScheduleService.create(username, body, principal.user()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> cancel(
            @PathVariable String username,
            @PathVariable UUID id,
            @AuthenticationPrincipal CustomUserDetails principal) {
        streamScheduleService.cancel(username, id, principal.user());
        return ResponseEntity.noContent().build();
    }
}
