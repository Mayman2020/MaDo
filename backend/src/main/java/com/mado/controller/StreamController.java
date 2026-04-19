package com.mado.controller;

import com.mado.dto.LiveStreamResponse;
import com.mado.dto.StreamDetailResponse;
import com.mado.dto.StreamPublishRequest;
import com.mado.service.StreamService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/streams")
@RequiredArgsConstructor
public class StreamController {

    private final StreamService streamService;

    @GetMapping("/live")
    public ResponseEntity<Page<LiveStreamResponse>> live(@PageableDefault(size = 24) Pageable pageable) {
        return ResponseEntity.ok(streamService.live(pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<StreamDetailResponse> get(@PathVariable UUID id) {
        return ResponseEntity.ok(streamService.getById(id));
    }

    @PostMapping("/on-publish")
    public ResponseEntity<Map<String, String>> onPublish(@RequestBody(required = false) StreamPublishRequest request) {
        return ResponseEntity.ok(streamService.onPublish(request));
    }

    @PostMapping("/on-publish-done")
    public ResponseEntity<Map<String, String>> onPublishDone(@RequestBody(required = false) StreamPublishRequest request) {
        return ResponseEntity.ok(streamService.onPublishDone(request));
    }

    @PostMapping("/on-play")
    public ResponseEntity<Map<String, String>> onPlay(@RequestBody(required = false) StreamPublishRequest request) {
        return ResponseEntity.ok(Map.of("status", "playing", "streamKey", request == null ? "" : request.getName()));
    }
}
