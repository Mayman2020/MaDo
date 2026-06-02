package com.mado.controller;

import com.mado.dto.AuthRequest;
import com.mado.dto.ChangePasswordRequest;
import com.mado.dto.EmailTokenRequest;
import com.mado.dto.ForgotPasswordRequest;
import com.mado.dto.RefreshRequest;
import com.mado.dto.RefreshTokenResponse;
import com.mado.dto.RegisterRequest;
import com.mado.dto.ResetPasswordRequest;
import com.mado.exception.BadRequestException;
import com.mado.security.CustomUserDetails;
import com.mado.security.LoginRateLimiter;
import com.mado.security.RegisterRateLimiter;
import com.mado.service.AuthService;
import com.mado.util.ClientIp;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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
    private final LoginRateLimiter loginRateLimiter;
    private final RegisterRateLimiter registerRateLimiter;

    @PostMapping("/register")
    public ResponseEntity<RefreshTokenResponse> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletRequest http) {
        registerRateLimiter.assertAllowed(ClientIp.from(http));
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<RefreshTokenResponse> login(
            @Valid @RequestBody AuthRequest request,
            HttpServletRequest http) {
        String ip = ClientIp.from(http);
        loginRateLimiter.assertAllowed(ip);
        try {
            RefreshTokenResponse res = authService.login(request);
            loginRateLimiter.clear(ip);
            return ResponseEntity.ok(res);
        } catch (BadCredentialsException e) {
            loginRateLimiter.recordFailure(ip);
            throw e;
        } catch (BadRequestException e) {
            if ("Invalid authenticator code".equals(e.getMessage())) {
                loginRateLimiter.recordFailure(ip);
            }
            throw e;
        }
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

    @PostMapping("/change-password")
    public ResponseEntity<Map<String, String>> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) {
        authService.changePassword(principal.user(), request.getCurrentPassword(), request.getNewPassword());
        return ResponseEntity.ok(Map.of("status", "changed"));
    }
}
