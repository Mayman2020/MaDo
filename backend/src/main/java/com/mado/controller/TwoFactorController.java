package com.mado.controller;

import com.mado.dto.TwoFactorBeginRequest;
import com.mado.dto.TwoFactorCodeRequest;
import com.mado.dto.TwoFactorDisableRequest;
import com.mado.dto.TwoFactorSetupResponse;
import com.mado.security.CustomUserDetails;
import com.mado.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/auth/2fa")
@RequiredArgsConstructor
public class TwoFactorController {

    private final AuthService authService;

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> status(@AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(authService.twoFactorStatus(principal.user()));
    }

    @PostMapping("/begin")
    public ResponseEntity<TwoFactorSetupResponse> begin(
            @Valid @RequestBody TwoFactorBeginRequest body,
            @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(authService.twoFactorBegin(principal.user(), body.getPassword()));
    }

    @PostMapping("/confirm")
    public ResponseEntity<Map<String, String>> confirm(
            @Valid @RequestBody TwoFactorCodeRequest body,
            @AuthenticationPrincipal CustomUserDetails principal) {
        authService.twoFactorConfirm(principal.user(), body.getCode());
        return ResponseEntity.ok(Map.of("status", "enabled"));
    }

    @PostMapping("/disable")
    public ResponseEntity<Map<String, String>> disable(
            @Valid @RequestBody TwoFactorDisableRequest body,
            @AuthenticationPrincipal CustomUserDetails principal) {
        authService.twoFactorDisable(principal.user(), body.getPassword(), body.getCode());
        return ResponseEntity.ok(Map.of("status", "disabled"));
    }
}
