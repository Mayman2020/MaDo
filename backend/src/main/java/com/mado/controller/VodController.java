package com.mado.controller;

import com.mado.entity.Vod;
import com.mado.service.VodService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
}
