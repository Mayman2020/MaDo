package com.mado.controller;

import com.mado.entity.Subscription;
import com.mado.security.CustomUserDetails;
import com.mado.service.SubscriptionQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/subscriptions")
@RequiredArgsConstructor
public class SubscriptionController {

    private final SubscriptionQueryService subscriptionQueryService;

    @GetMapping("/me")
    public ResponseEntity<List<Subscription>> mine(@AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(subscriptionQueryService.myActiveSubscriptions(principal.user()));
    }
}
