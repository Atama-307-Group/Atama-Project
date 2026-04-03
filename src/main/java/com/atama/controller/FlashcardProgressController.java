package com.atama.controller;

import com.atama.model.FlashcardProgress;
import com.atama.model.FlashcardProgress.KnowledgeLevel;
import com.atama.service.FlashcardProgressService;
import com.atama.service.FlashcardProgressService.SetProgressStats;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/flashcard-sets")
@RequiredArgsConstructor
public class FlashcardProgressController {

    private final FlashcardProgressService progressService;

    /** GET /api/flashcard-sets/{setId}/progress
     *  Returns all card progress rows for the current user, initializing missing ones. */
    @GetMapping("/{setId}/progress")
    public ResponseEntity<List<FlashcardProgress>> getProgress(@PathVariable UUID setId) {
        UUID userId = getAuthenticatedUserId();
        return ResponseEntity.ok(progressService.getOrInitProgress(userId, setId));
    }

    /** PATCH /api/flashcard-sets/{setId}/flashcards/{flashcardId}/progress
     *  Body: { "knowledgeLevel": "KNOW_WELL" } */
    @PatchMapping("/{setId}/flashcards/{flashcardId}/progress")
    public ResponseEntity<FlashcardProgress> updateProgress(
            @PathVariable UUID setId,
            @PathVariable UUID flashcardId,
            @RequestBody Map<String, String> body) {
        UUID userId = getAuthenticatedUserId();
        KnowledgeLevel level = KnowledgeLevel.valueOf(body.get("knowledgeLevel"));
        return ResponseEntity.ok(progressService.updateKnowledgeLevel(userId, flashcardId, level));
    }

    /** POST /api/flashcard-sets/{setId}/study-time
     *  Body: { "seconds": 120 } */
    @PostMapping("/{setId}/study-time")
    public ResponseEntity<Void> addStudyTime(
            @PathVariable UUID setId,
            @RequestBody Map<String, Long> body) {
        UUID userId = getAuthenticatedUserId();
        long seconds = body.getOrDefault("seconds", 0L);
        progressService.addStudyTime(userId, setId, seconds);
        return ResponseEntity.noContent().build();
    }

    /** GET /api/flashcard-sets/{setId}/stats
     *  Returns aggregate progress stats for the current user. */
    @GetMapping("/{setId}/stats")
    public ResponseEntity<SetProgressStats> getStats(@PathVariable UUID setId) {
        UUID userId = getAuthenticatedUserId();
        return ResponseEntity.ok(progressService.getStats(userId, setId));
    }

    private UUID getAuthenticatedUserId() {
        String userId = (String) SecurityContextHolder.getContext()
                .getAuthentication()
                .getPrincipal();
        return UUID.fromString(userId);
    }
}