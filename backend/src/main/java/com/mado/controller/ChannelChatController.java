package com.mado.controller;

import com.mado.dto.ChatMessageResponse;
import com.mado.dto.ChatSendRequest;
import com.mado.security.CustomUserDetails;
import com.mado.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/channels/{channelId}/messages")
@RequiredArgsConstructor
public class ChannelChatController {

    private final ChatService chatService;

    @GetMapping
    public ResponseEntity<List<ChatMessageResponse>> recent(
            @PathVariable UUID channelId,
            @RequestParam(defaultValue = "50") int limit) {
        return ResponseEntity.ok(chatService.recent(channelId, Math.min(limit, 200)));
    }

    @PostMapping
    public ResponseEntity<ChatMessageResponse> send(
            @PathVariable UUID channelId,
            @Valid @RequestBody ChatSendRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(chatService.send(channelId, request, principal.user()));
    }
}
