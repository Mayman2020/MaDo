package com.mado.controller;

import com.mado.dto.AuthRequest;
import com.mado.dto.EmailTokenRequest;
import com.mado.dto.ForgotPasswordRequest;
import com.mado.dto.RefreshRequest;
import com.mado.dto.RefreshTokenResponse;
import com.mado.dto.RegisterRequest;
import com.mado.dto.ResetPasswordRequest;
import com.mado.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<RefreshTokenResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<RefreshTokenResponse> login(@Valid @RequestBody AuthRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/refresh")
    public ResponseEntity<RefreshTokenResponse> refresh(@Valid @RequestBody RefreshRequest request) {
        return ResponseEntity.ok(authService.refresh(request));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@Valid @RequestBody RefreshRequest request) {
        authService.logout(request);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/verify-email")
    public ResponseEntity<Map<String, String>> verifyEmail(@Valid @RequestBody EmailTokenRequest request) {
        return ResponseEntity.ok(Map.of("status", "accepted", "token", request.getToken()));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        return ResponseEntity.ok(Map.of("status", "email_queued", "email", request.getEmail()));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        return ResponseEntity.ok(Map.of("status", "accepted", "token", request.getToken()));
    }
}
