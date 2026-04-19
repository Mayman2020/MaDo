package com.mado.controller;

import com.mado.dto.CategoryResponse;
import com.mado.dto.LiveStreamResponse;
import com.mado.service.ChannelService;
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
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final ChannelService channelService;

    @GetMapping
    public ResponseEntity<Page<CategoryResponse>> list(@PageableDefault(size = 50) Pageable pageable) {
        return ResponseEntity.ok(channelService.allCategories(pageable));
    }

    @GetMapping("/{slug}/streams")
    public ResponseEntity<Page<LiveStreamResponse>> streams(
            @PathVariable String slug,
            @PageableDefault(size = 24) Pageable pageable) {
        return ResponseEntity.ok(channelService.liveByCategory(slug, pageable));
    }
}
