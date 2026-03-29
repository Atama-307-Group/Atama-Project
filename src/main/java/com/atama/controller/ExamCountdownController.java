package com.atama.controller;

import com.atama.model.ExamCountdown;
import com.atama.service.ExamCountdownService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/countdowns")
public class ExamCountdownController {

    private final ExamCountdownService countdownService;

    public ExamCountdownController(ExamCountdownService countdownService) {
        this.countdownService = countdownService;
    }

    @GetMapping("/{userId}")
    public ResponseEntity<List<ExamCountdown>> getCountdowns(@PathVariable UUID userId) {
        return ResponseEntity.ok(countdownService.getCountdownsByUserId(userId));
    }

    @PostMapping("/{userId}")
    public ResponseEntity<ExamCountdown> createCountdown(
            @PathVariable UUID userId,
            @RequestBody CreateCountdownRequest request) {
        ExamCountdown created = countdownService.createCountdown(
                userId,
                request.reason(),
                request.examDateTime(),
                request.reminderMinutesBefore(),
                request.notifyByDesktop(),
                request.notifyByEmail());
        return ResponseEntity.ok(created);
    }

    @DeleteMapping("/{countdownId}")
    public ResponseEntity<Void> deleteCountdown(@PathVariable UUID countdownId) {
        countdownService.deleteCountdown(countdownId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{userId}/expired")
    public ResponseEntity<Void> deleteExpiredCountdowns(@PathVariable UUID userId) {
        countdownService.deleteExpiredCountdowns(userId);
        return ResponseEntity.noContent().build();
    }

    public record CreateCountdownRequest(
            String reason,
            Instant examDateTime,
            int reminderMinutesBefore,
            boolean notifyByDesktop,
            boolean notifyByEmail) {
    }
}
