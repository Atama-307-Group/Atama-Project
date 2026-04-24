package com.atama.controller;

import com.atama.service.RecommendationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/recommendations")
@RequiredArgsConstructor
public class RecommendationController {

    private final RecommendationService recommendationService;

    @GetMapping("/{userId}")
    public ResponseEntity<Map<String, Object>> getRecommendation(@PathVariable UUID userId) {
        try {
            return recommendationService.getRecommendation(userId)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.noContent().build());
        } catch (Exception e) {
            e.printStackTrace(); // will appear in Spring logs
            return ResponseEntity.internalServerError().build();
        }
    }
}