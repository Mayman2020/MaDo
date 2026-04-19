package com.mado.controller;

import com.mado.entity.Donation;
import com.mado.security.CustomUserDetails;
import com.mado.service.DonationService;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/channels/{username}/donations")
@RequiredArgsConstructor
public class DonationController {

    private final DonationService donationService;

    @GetMapping
    public ResponseEntity<Page<Donation>> list(
            @PathVariable String username,
            @PageableDefault(size = 30) Pageable pageable) {
        return ResponseEntity.ok(donationService.listForChannel(username, pageable));
    }

    @PostMapping
    public ResponseEntity<Donation> donate(
            @PathVariable String username,
            @RequestBody DonateBody body,
            @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(donationService.donate(username, body.getAmount(), body.getMessage(), principal.user()));
    }

    @Getter
    @Setter
    public static class DonateBody {
        @NotNull
        @DecimalMin("0.01")
        private BigDecimal amount;
        private String message;
    }
}
