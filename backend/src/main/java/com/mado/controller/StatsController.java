package com.mado.controller;

import com.mado.service.StatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/stats")
@RequiredArgsConstructor
public class StatsController {

    private final StatsService statsService;

    /** GET /api/stats/channel/:username?period=THIS_MONTH */
    @GetMapping("/channel/{username}")
    public ResponseEntity<Map<String, Object>> channelStats(
            @PathVariable String username,
            @RequestParam(defaultValue = "THIS_MONTH") String period) {
        return ResponseEntity.ok(statsService.getChannelStats(username, period));
    }

    /** GET /api/stats/channel/:username/hourly?date=2025-01-15 */
    @GetMapping("/channel/{username}/hourly")
    public ResponseEntity<List<Map<String, Object>>> hourly(
            @PathVariable String username,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        if (date == null) date = LocalDate.now(ZoneOffset.UTC);
        return ResponseEntity.ok(statsService.getHourlyBreakdown(username, date));
    }

    /** GET /api/stats/platform */
    @GetMapping("/platform")
    public ResponseEntity<Map<String, Object>> platform() {
        return ResponseEntity.ok(statsService.getPlatformStats());
    }
}
