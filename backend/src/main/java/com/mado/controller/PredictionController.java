package com.mado.controller;

import com.mado.dto.engagement.PredictionCreateRequest;
import com.mado.dto.engagement.PredictionPlaceBetRequest;
import com.mado.entity.Prediction;
import com.mado.security.CustomUserDetails;
import com.mado.service.PredictionService;
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
@RequestMapping("/api/channels/{username}/predictions")
@RequiredArgsConstructor
public class PredictionController {

    private final PredictionService predictionService;

    @GetMapping
    public ResponseEntity<List<Prediction>> active(@PathVariable String username) {
        return ResponseEntity.ok(predictionService.active(username));
    }

    @PostMapping
    public ResponseEntity<Prediction> create(
            @PathVariable String username,
            @Valid @RequestBody PredictionCreateRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(predictionService.create(username, request, principal.user()));
    }

    @PostMapping("/{predictionId}/bet")
    public ResponseEntity<Void> placeBet(
            @PathVariable String username,
            @PathVariable UUID predictionId,
            @Valid @RequestBody PredictionPlaceBetRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) {
        predictionService.placeBet(username, predictionId, request, principal.user());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{predictionId}/resolve/{winningOptionId}")
    public ResponseEntity<Void> resolve(
            @PathVariable String username,
            @PathVariable UUID predictionId,
            @PathVariable UUID winningOptionId,
            @AuthenticationPrincipal CustomUserDetails principal) {
        predictionService.resolve(username, predictionId, winningOptionId, principal.user());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{predictionId}/cancel")
    public ResponseEntity<Void> cancel(
            @PathVariable String username,
            @PathVariable UUID predictionId,
            @AuthenticationPrincipal CustomUserDetails principal) {
        predictionService.cancel(username, predictionId, principal.user());
        return ResponseEntity.noContent().build();
    }
}
