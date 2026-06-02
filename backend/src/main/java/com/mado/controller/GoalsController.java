package com.mado.controller;

import com.mado.entity.Channel;
import com.mado.entity.StreamerGoal;
import com.mado.exception.NotFoundException;
import com.mado.repository.ChannelRepository;
import com.mado.repository.StreamerGoalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/goals")
@RequiredArgsConstructor
public class GoalsController {

    private final StreamerGoalRepository goalRepo;
    private final ChannelRepository      channelRepo;

    /** GET /api/goals/:channelId — public active goals */
    @GetMapping("/{channelId}")
    public ResponseEntity<List<StreamerGoal>> publicGoals(@PathVariable UUID channelId) {
        return ResponseEntity.ok(goalRepo.findByChannelIdAndActiveOrderByCreatedAtDesc(channelId, true));
    }

    /** POST /api/goals — create goal */
    @PostMapping
    public ResponseEntity<StreamerGoal> create(
            @AuthenticationPrincipal UserDetails principal,
            @RequestBody Map<String, Object> body) {
        Channel ch = channelRepo.findByUserUsername(principal.getUsername()).orElseThrow();
        StreamerGoal goal = StreamerGoal.builder()
                .channel(ch)
                .title((String) body.get("title"))
                .goalType((String) body.get("goalType"))
                .targetValue(((Number) body.get("targetValue")).longValue())
                .rewardText((String) body.get("rewardText"))
                .active(true)
                .build();
        return ResponseEntity.ok(goalRepo.save(goal));
    }

    /** PATCH /api/goals/:id */
    @PatchMapping("/{id}")
    public ResponseEntity<StreamerGoal> update(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails principal,
            @RequestBody Map<String, Object> body) {
        StreamerGoal goal = goalRepo.findById(id).orElseThrow(() -> new NotFoundException("Goal not found"));
        if (!goal.getChannel().getUser().getUsername().equals(principal.getUsername()))
            return ResponseEntity.status(403).build();
        if (body.containsKey("title"))       goal.setTitle((String) body.get("title"));
        if (body.containsKey("rewardText"))  goal.setRewardText((String) body.get("rewardText"));
        if (body.containsKey("currentValue"))
            goal.setCurrentValue(((Number) body.get("currentValue")).longValue());
        return ResponseEntity.ok(goalRepo.save(goal));
    }

    /** DELETE /api/goals/:id */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails principal) {
        StreamerGoal goal = goalRepo.findById(id).orElseThrow(() -> new NotFoundException("Goal not found"));
        if (!goal.getChannel().getUser().getUsername().equals(principal.getUsername()))
            return ResponseEntity.status(403).build();
        goalRepo.delete(goal);
        return ResponseEntity.noContent().build();
    }

    /** PATCH /api/goals/:id/complete */
    @PatchMapping("/{id}/complete")
    public ResponseEntity<StreamerGoal> complete(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails principal) {
        StreamerGoal goal = goalRepo.findById(id).orElseThrow(() -> new NotFoundException("Goal not found"));
        if (!goal.getChannel().getUser().getUsername().equals(principal.getUsername()))
            return ResponseEntity.status(403).build();
        goal.setCompleted(true);
        goal.setActive(false);
        goal.setCompletedAt(Instant.now());
        goal.setCurrentValue(goal.getTargetValue());
        return ResponseEntity.ok(goalRepo.save(goal));
    }
}
