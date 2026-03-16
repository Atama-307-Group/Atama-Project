package com.atama.controller;

import com.atama.model.Goal;
import com.atama.service.GoalService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/goals")
public class GoalController {

    private final GoalService goalService;

    public GoalController(GoalService goalService) {
        this.goalService = goalService;
    }

    @GetMapping("/{userId}")
    public ResponseEntity<Goal> getGoal(@PathVariable UUID userId) {
        return ResponseEntity.ok(goalService.getGoalByUserId(userId));
    }

    @PatchMapping("/{userId}")
    public ResponseEntity<Goal> updateGoal(
            @PathVariable UUID userId,
            @RequestBody UpdateGoalRequest request) {
        return ResponseEntity.ok(goalService.updateGoal(userId, request));
    }

    public record UpdateGoalRequest(
            java.util.Set<java.time.DayOfWeek> selectedDaysOfWeek,
            long minutesPerDay,
            Boolean notifyByDesktop,
            Boolean notifyByEmail,
            java.time.LocalTime notificationTime) {
    }

    @PostMapping("/{userId}/start")
    public ResponseEntity<Void> startStudying(@PathVariable UUID userId) {
        goalService.startStudying(userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{userId}/stop")
    public ResponseEntity<Void> stopStudying(@PathVariable UUID userId) {
        goalService.stopStudying(userId);
        return ResponseEntity.noContent().build();
    }
}