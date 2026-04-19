package com.mado.controller;

import com.mado.dto.UserPatchRequest;
import com.mado.dto.UserResponse;
import com.mado.entity.User;
import com.mado.security.CustomUserDetails;
import com.mado.service.UserProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserProfileService userProfileService;

    @GetMapping("/{username}")
    public ResponseEntity<UserResponse> get(@PathVariable String username) {
        return ResponseEntity.ok(userProfileService.getByUsername(username));
    }

    @PatchMapping("/{username}")
    public ResponseEntity<UserResponse> patch(
            @PathVariable String username,
            @Valid @RequestBody UserPatchRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) {
        User actor = requireUser(principal);
        return ResponseEntity.ok(userProfileService.patch(username, request, actor));
    }

    @PostMapping("/{username}/avatar")
    public ResponseEntity<Map<String, String>> avatar(
            @PathVariable String username,
            @AuthenticationPrincipal CustomUserDetails principal) {
        requireUser(principal);
        return ResponseEntity.ok(Map.of("status", "pending", "message", "Upload to MinIO not wired in this build"));
    }

    private static User requireUser(CustomUserDetails principal) {
        if (principal == null) {
            throw new org.springframework.security.access.AccessDeniedException("Unauthorized");
        }
        return principal.user();
    }
}
