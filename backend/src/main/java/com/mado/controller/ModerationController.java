package com.mado.controller;

import com.mado.dto.moderation.BanRequest;
import com.mado.dto.moderation.BannedWordRequest;
import com.mado.entity.Ban;
import com.mado.entity.BannedWord;
import com.mado.entity.Moderator;
import com.mado.entity.User;
import com.mado.security.CustomUserDetails;
import com.mado.service.ModerationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/channels/{username}/moderation")
@RequiredArgsConstructor
public class ModerationController {

    private final ModerationService moderationService;

    @GetMapping("/bans")
    public ResponseEntity<List<Ban>> bans(
            @PathVariable String username,
            @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(moderationService.listBans(username, principal.user()));
    }

    @PostMapping("/bans")
    public ResponseEntity<Ban> ban(
            @PathVariable String username,
            @Valid @RequestBody BanRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(moderationService.ban(username, request, principal.user()));
    }

    @DeleteMapping("/bans/{banId}")
    public ResponseEntity<Void> unban(
            @PathVariable String username,
            @PathVariable UUID banId,
            @AuthenticationPrincipal CustomUserDetails principal) {
        moderationService.unban(username, banId, principal.user());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/moderators")
    public ResponseEntity<List<Moderator>> moderators(
            @PathVariable String username,
            @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(moderationService.listMods(username, principal.user()));
    }

    @PostMapping("/moderators")
    public ResponseEntity<Void> addMod(
            @PathVariable String username,
            @Valid @RequestBody com.mado.dto.moderation.ModeratorInviteRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) {
        moderationService.addMod(username, request.getUserId(), principal.user());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/moderators/{userId}")
    public ResponseEntity<Void> removeMod(
            @PathVariable String username,
            @PathVariable UUID userId,
            @AuthenticationPrincipal CustomUserDetails principal) {
        moderationService.removeMod(username, userId, principal.user());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/banned-words")
    public ResponseEntity<List<BannedWord>> words(
            @PathVariable String username,
            @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(moderationService.listWords(username, principal.user()));
    }

    @PostMapping("/banned-words")
    public ResponseEntity<BannedWord> addWord(
            @PathVariable String username,
            @Valid @RequestBody BannedWordRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(moderationService.addWord(username, request, principal.user()));
    }

    @DeleteMapping("/banned-words/{wordId}")
    public ResponseEntity<Void> removeWord(
            @PathVariable String username,
            @PathVariable UUID wordId,
            @AuthenticationPrincipal CustomUserDetails principal) {
        moderationService.removeWord(username, wordId, principal.user());
        return ResponseEntity.noContent().build();
    }
}
