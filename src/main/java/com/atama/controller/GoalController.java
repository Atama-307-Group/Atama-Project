package com.atama.controller;

import com.atama.model.Goal;
import com.atama.service.GoalService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
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

    @PutMapping("/{userId}")
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

    @GetMapping("/users/{userId}/streak")
    public ResponseEntity<StreakResponse> getStreak(@PathVariable UUID userId) {
        Goal goal = goalService.getGoalByUserId(userId);
        if (goal == null) {
            return ResponseEntity.notFound().build();
        }

        List<String> studyDates = goal.getStudyDates() != null
                ? goal.getStudyDates().stream().map(LocalDate::toString).toList()
                : Collections.emptyList();

        // Use effective streak — resets lazily if user missed a day
        return ResponseEntity.ok(new StreakResponse(
                goal.getEffectiveCurrentStreak(),
                goal.getBestStreak(),
                studyDates
        ));
    }

    public record StreakResponse(int currentStreak, int bestStreak, java.util.List<String> studyDates) {
    }
}