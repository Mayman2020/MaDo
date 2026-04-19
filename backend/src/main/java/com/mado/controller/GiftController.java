package com.mado.controller;

import com.mado.entity.Gift;
import com.mado.entity.User;
import com.mado.repository.UserRepository;
import com.mado.security.CustomUserDetails;
import com.mado.service.GiftService;
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

import java.util.UUID;

@RestController
@RequestMapping("/api/channels/{username}/gifts")
@RequiredArgsConstructor
public class GiftController {

    private final GiftService giftService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<Page<Gift>> list(
            @PathVariable String username,
            @PageableDefault(size = 30) Pageable pageable) {
        return ResponseEntity.ok(giftService.list(username, pageable));
    }

    @PostMapping
    public ResponseEntity<Gift> send(
            @PathVariable String username,
            @RequestBody GiftSendBody body,
            @AuthenticationPrincipal CustomUserDetails principal) {
        User recipient = userRepository.findById(body.getRecipientId()).orElseThrow(() -> new com.mado.exception.NotFoundException("Recipient"));
        return ResponseEntity.ok(giftService.send(username, principal.user(), recipient, body.getTier(), body.getQuantity()));
    }

    @Getter
    @Setter
    public static class GiftSendBody {
        @NotNull
        private UUID recipientId;
        private String tier;
        private int quantity = 1;
    }
}
