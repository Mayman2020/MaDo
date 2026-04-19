package com.mado.controller;

import com.mado.dto.ClipCreateRequest;
import com.mado.dto.ClipResponse;
import com.mado.security.CustomUserDetails;
import com.mado.service.ClipService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/clips")
@RequiredArgsConstructor
public class ClipController {

    private final ClipService clipService;

    @GetMapping
    public ResponseEntity<Page<ClipResponse>> list(@PageableDefault(size = 24) Pageable pageable) {
        return ResponseEntity.ok(clipService.list(pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ClipResponse> get(@PathVariable UUID id) {
        return ResponseEntity.ok(clipService.get(id));
    }

    @PostMapping
    public ResponseEntity<ClipResponse> create(
            @Valid @RequestBody ClipCreateRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(clipService.create(request, principal.user()));
    }
}
