package com.mado.controller;

import com.mado.dto.UserPatchRequest;
import com.mado.dto.UserResponse;
import com.mado.entity.User;
import com.mado.security.CustomUserDetails;
import com.mado.service.FileStorageService;
import com.mado.service.UserProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserProfileService userProfileService;
    private final FileStorageService fileStorageService;

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

    @PostMapping(value = "/{username}/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<UserResponse> uploadAvatar(
            @PathVariable String username,
            @RequestPart("file") MultipartFile file,
            @AuthenticationPrincipal CustomUserDetails principal) throws Exception {
        User actor = requireUser(principal);
        String url = fileStorageService.store(file, "avatars");
        return ResponseEntity.ok(userProfileService.updateAvatar(username, url, actor));
    }

    @PostMapping(value = "/{username}/banner", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<UserResponse> uploadBanner(
            @PathVariable String username,
            @RequestPart("file") MultipartFile file,
            @AuthenticationPrincipal CustomUserDetails principal) throws Exception {
        User actor = requireUser(principal);
        String url = fileStorageService.store(file, "banners");
        return ResponseEntity.ok(userProfileService.updateBanner(username, url, actor));
    }

    private static User requireUser(CustomUserDetails principal) {
        if (principal == null) {
            throw new org.springframework.security.access.AccessDeniedException("Unauthorized");
        }
        return principal.user();
    }
}
