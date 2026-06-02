package com.mado.controller;

import com.mado.entity.WalletTransaction;
import com.mado.exception.BadRequestException;
import com.mado.security.CustomUserDetails;
import com.mado.service.WalletService;
import com.stripe.exception.StripeException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/wallet")
@RequiredArgsConstructor
public class WalletController {

    private final WalletService walletService;

    @GetMapping("/balance")
    public ResponseEntity<Map<String, Long>> balance(
            @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(Map.of("balance", walletService.balance(principal.user())));
    }

    @PostMapping("/purchase")
    public ResponseEntity<Map<String, Object>> purchase(
            @RequestBody Map<String, Integer> body,
            @AuthenticationPrincipal CustomUserDetails principal) throws StripeException {
        int amountCents = body.getOrDefault("amountCents", 0);
        if (amountCents < 100 || amountCents > 500_000) {
            throw new BadRequestException("amountCents must be between 100 and 500000");
        }
        return ResponseEntity.ok(walletService.createPurchaseIntent(principal.user(), amountCents));
    }

    @GetMapping("/history")
    public ResponseEntity<Page<WalletTransaction>> history(
            @PageableDefault(size = 20) Pageable pageable,
            @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(walletService.history(principal.user(), pageable));
    }
}
