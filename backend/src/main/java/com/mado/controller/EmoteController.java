package com.mado.controller;

import com.mado.entity.Emote;
import com.mado.entity.User;
import com.mado.security.CustomUserDetails;
import com.mado.service.EmoteService;
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
@RequestMapping("/api/channels/{username}/emotes")
@RequiredArgsConstructor
public class EmoteController {

    private final EmoteService emoteService;

    @GetMapping
    public ResponseEntity<List<Emote>> list(@PathVariable String username) {
        return ResponseEntity.ok(emoteService.list(username));
    }

    @PostMapping
    public ResponseEntity<Emote> create(
            @PathVariable String username,
            @RequestBody Emote body,
            @AuthenticationPrincipal CustomUserDetails principal) {
        User actor = principal.user();
        return ResponseEntity.ok(emoteService.create(username, body, actor));
    }

    @DeleteMapping("/{emoteId}")
    public ResponseEntity<Void> delete(
            @PathVariable String username,
            @PathVariable UUID emoteId,
            @AuthenticationPrincipal CustomUserDetails principal) {
        emoteService.delete(username, emoteId, principal.user());
        return ResponseEntity.noContent().build();
    }
}
