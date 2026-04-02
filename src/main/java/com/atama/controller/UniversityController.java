package com.atama.controller;

import com.atama.model.University;
import com.atama.service.UniversityService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
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

    @GetMapping("/university")
    public ResponseEntity<?> getUniversity() {
        UUID userId = getAuthenticatedUserId();
        University university = universityService.getUniversityByUserId(userId);
        return ResponseEntity.ok(university);
    }

    private UUID getAuthenticatedUserId() {
        String userId = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return UUID.fromString(userId);
    }
}