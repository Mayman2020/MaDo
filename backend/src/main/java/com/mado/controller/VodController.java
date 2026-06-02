package com.mado.controller;

import com.mado.entity.Vod;
import com.mado.security.CustomUserDetails;
import com.mado.service.VodService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/channels/{username}/vods")
@RequiredArgsConstructor
public class VodController {

    private final VodService vodService;

    @GetMapping
    public ResponseEntity<Page<Vod>> list(
            @PathVariable String username,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(vodService.listPublic(username, pageable));
    }

    @PatchMapping("/{vodId}")
    public ResponseEntity<Vod> update(
            @PathVariable String username,
            @PathVariable UUID vodId,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(vodService.update(username, vodId, body, principal.user()));
    }

    @DeleteMapping("/{vodId}")
    public ResponseEntity<Void> delete(
            @PathVariable String username,
            @PathVariable UUID vodId,
            @AuthenticationPrincipal CustomUserDetails principal) {
        vodService.delete(username, vodId, principal.user());
        return ResponseEntity.noContent().build();
    }
}
