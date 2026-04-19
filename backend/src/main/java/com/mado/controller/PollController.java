package com.mado.controller;

import com.mado.dto.engagement.PollCreateRequest;
import com.mado.dto.engagement.PollVoteRequest;
import com.mado.entity.Poll;
import com.mado.security.CustomUserDetails;
import com.mado.service.PollService;
import jakarta.validation.Valid;
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
@RequestMapping("/api/channels/{username}/polls")
@RequiredArgsConstructor
public class PollController {

    private final PollService pollService;

    @GetMapping
    public ResponseEntity<List<Poll>> active(@PathVariable String username) {
        return ResponseEntity.ok(pollService.active(username));
    }

    @PostMapping
    public ResponseEntity<Poll> create(
            @PathVariable String username,
            @Valid @RequestBody PollCreateRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(pollService.create(username, request, principal.user()));
    }

    @PostMapping("/{pollId}/vote")
    public ResponseEntity<Void> vote(
            @PathVariable String username,
            @PathVariable UUID pollId,
            @Valid @RequestBody PollVoteRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) {
        pollService.vote(username, pollId, request.getOptionId(), principal.user());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{pollId}/end")
    public ResponseEntity<Void> end(
            @PathVariable String username,
            @PathVariable UUID pollId,
            @AuthenticationPrincipal CustomUserDetails principal) {
        pollService.end(username, pollId, principal.user());
        return ResponseEntity.noContent().build();
    }
}
