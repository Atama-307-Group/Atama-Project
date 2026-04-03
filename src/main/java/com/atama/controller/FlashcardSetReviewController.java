package com.atama.controller;

import com.atama.dto.response.ReviewDTO;
import com.atama.model.ReviewTag;
import com.atama.service.FlashcardSetReviewService;
import com.atama.service.FlashcardSetReviewService.ReviewAggregate;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class FlashcardSetReviewController {

    private final FlashcardSetReviewService reviewService;

    /** GET /api/flashcard-sets/{setId}/reviews/mine */
    @GetMapping("/api/flashcard-sets/{setId}/reviews/mine")
    public ResponseEntity<ReviewDTO> getMyReview(@PathVariable UUID setId) {
        UUID userId = getAuthenticatedUserId();
        return reviewService.getMyReview(userId, setId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    /** POST /api/flashcard-sets/{setId}/reviews
     *  Body: { "stars": 4, "tags": ["WELL_ORGANIZED", "EASY_TO_STUDY"] } */
    @PostMapping("/api/flashcard-sets/{setId}/reviews")
    public ResponseEntity<ReviewDTO> upsertReview(
            @PathVariable UUID setId,
            @RequestBody ReviewRequest body) {
        UUID userId = getAuthenticatedUserId();
        return ResponseEntity.ok(reviewService.upsertReview(userId, setId, body.stars(), body.tags()));
    }

    /** DELETE /api/flashcard-sets/{setId}/reviews/mine */
    @DeleteMapping("/api/flashcard-sets/{setId}/reviews/mine")
    public ResponseEntity<Void> deleteReview(@PathVariable UUID setId) {
        UUID userId = getAuthenticatedUserId();
        reviewService.deleteReview(userId, setId);
        return ResponseEntity.noContent().build();
    }

    /** GET /api/flashcard-sets/{setId}/reviews/aggregate */
    @GetMapping("/api/flashcard-sets/{setId}/reviews/aggregate")
    public ResponseEntity<ReviewAggregate> getAggregate(@PathVariable UUID setId) {
        return ResponseEntity.ok(reviewService.getAggregate(setId));
    }

    public record ReviewRequest(int stars, List<ReviewTag> tags) {}

    private UUID getAuthenticatedUserId() {
        String userId = (String) SecurityContextHolder.getContext()
                .getAuthentication()
                .getPrincipal();
        return UUID.fromString(userId);
    }
}