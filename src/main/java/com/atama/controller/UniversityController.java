package com.atama.controller;

import com.atama.model.University;
import com.atama.service.UniversityService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/users")
public class UniversityController {

    private final UniversityService universityService;

    public UniversityController(UniversityService universityService) {
        this.universityService = universityService;
    }

    @GetMapping("/{userId}/university")
    public ResponseEntity<?> getUniversity(@PathVariable UUID userId) {
        University university = universityService.getUniversityByUserId(userId);
        return ResponseEntity.ok(university);
    }
}