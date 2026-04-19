package com.mado.controller;

import com.mado.dto.UserResponse;
import com.mado.entity.UserPreferences;
import com.mado.mapper.UserMapper;
import com.mado.security.CustomUserDetails;
import com.mado.service.UserPreferencesService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/me")
@RequiredArgsConstructor
public class CurrentUserController {

    private final UserMapper userMapper;
    private final UserPreferencesService userPreferencesService;

    @GetMapping
    public ResponseEntity<UserResponse> me(@AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(userMapper.toResponse(principal.user()));
    }

    @GetMapping("/preferences")
    public ResponseEntity<UserPreferences> preferences(@AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(userPreferencesService.getOrCreate(principal.user()));
    }

    @PatchMapping("/preferences")
    public ResponseEntity<UserPreferences> patchPreferences(
            @AuthenticationPrincipal CustomUserDetails principal,
            @RequestBody UserPreferences patch) {
        return ResponseEntity.ok(userPreferencesService.patch(principal.user(), patch));
    }
}
