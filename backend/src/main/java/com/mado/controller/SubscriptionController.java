package com.mado.controller;

import com.mado.dto.SubscribeRequest;
import com.mado.entity.Subscription;
import com.mado.security.CustomUserDetails;
import com.mado.service.SubscriptionQueryService;
import com.mado.service.SubscriptionService;
import com.stripe.exception.StripeException;
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
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/subscriptions")
@RequiredArgsConstructor
public class SubscriptionController {

    private final SubscriptionQueryService subscriptionQueryService;
    private final SubscriptionService subscriptionService;

    @GetMapping("/me")
    public ResponseEntity<List<Subscription>> mine(@AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(subscriptionQueryService.myActiveSubscriptions(principal.user()));
    }

    @PostMapping("/{channelId}")
    public ResponseEntity<Map<String, Object>> subscribe(
            @PathVariable UUID channelId,
            @Valid @RequestBody SubscribeRequest body,
            @AuthenticationPrincipal CustomUserDetails principal) throws StripeException {
        return ResponseEntity.ok(subscriptionService.createSubscriptionIntent(channelId, body.getTier(), principal.user()));
    }
}
