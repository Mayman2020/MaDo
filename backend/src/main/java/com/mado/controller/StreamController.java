package com.mado.controller;

import com.mado.dto.StreamPublishRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/streams")
public class StreamController {

    @PostMapping("/on-publish")
    public ResponseEntity<Map<String, String>> onPublish(@RequestBody(required = false) StreamPublishRequest request) {
        return ResponseEntity.ok(Map.of("status", "accepted", "streamKey", request == null ? "" : request.getName()));
    }

    @PostMapping("/on-publish-done")
    public ResponseEntity<Map<String, String>> onPublishDone(@RequestBody(required = false) StreamPublishRequest request) {
        return ResponseEntity.ok(Map.of("status", "closed", "streamKey", request == null ? "" : request.getName()));
    }

    @PostMapping("/on-play")
    public ResponseEntity<Map<String, String>> onPlay(@RequestBody(required = false) StreamPublishRequest request) {
        return ResponseEntity.ok(Map.of("status", "playing", "streamKey", request == null ? "" : request.getName()));
    }
}
