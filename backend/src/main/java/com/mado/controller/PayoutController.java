package com.mado.controller;

import com.mado.entity.Channel;
import com.mado.entity.Payout;
import com.mado.repository.ChannelRepository;
import com.mado.service.PayoutService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payouts")
@RequiredArgsConstructor
public class PayoutController {

    private final PayoutService     payoutService;
    private final ChannelRepository channelRepo;

    /** GET /api/payouts/summary */
    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> summary(
            @AuthenticationPrincipal UserDetails principal) {
        Channel ch = channelRepo.findByUserUsername(principal.getUsername()).orElse(null);
        if (ch == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(payoutService.getEarningsSummary(ch.getId()));
    }

    /** GET /api/payouts/history */
    @GetMapping("/history")
    public ResponseEntity<Page<Payout>> history(
            @AuthenticationPrincipal UserDetails principal,
            @RequestParam(defaultValue = "0") int page) {
        Channel ch = channelRepo.findByUserUsername(principal.getUsername()).orElse(null);
        if (ch == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(payoutService.getPayoutHistory(ch.getId(), page));
    }

    /** POST /api/payouts/connect-stripe — returns Stripe onboarding URL placeholder */
    @PostMapping("/connect-stripe")
    public ResponseEntity<Map<String, String>> connectStripe(
            @AuthenticationPrincipal UserDetails principal) {
        // In production: create Stripe Connect account + return onboarding URL
        return ResponseEntity.ok(Map.of(
                "url", "https://connect.stripe.com/setup/e/acct_placeholder",
                "message", "Stripe Connect onboarding — configure STRIPE_SECRET_KEY in production"
        ));
    }

    /** GET /api/payouts/stripe-status */
    @GetMapping("/stripe-status")
    public ResponseEntity<Map<String, Object>> stripeStatus(
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(Map.of(
                "connected", false,
                "message",   "Configure Stripe Connect in production"
        ));
    }
}
