package com.atama.controller;

import com.atama.model.CourseLeaveDate;
import com.atama.repository.CourseLeaveDateRepository;
import com.atama.service.CourseLeaveDateService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
public class CourseLeaveDateController {

    private final CourseLeaveDateService courseLeaveDateService;

    public CourseLeaveDateController(CourseLeaveDateService courseLeaveDateService) {
        this.courseLeaveDateService = courseLeaveDateService;
    }

    @PostMapping("/{userId}/schedule-leave")
    public ResponseEntity<CourseLeaveDate> scheduleLeave(
            @PathVariable UUID userId,
            @RequestBody Map<String, String> body
    ) {
        Instant scheduledFor = OffsetDateTime.parse(body.get("scheduledFor"))
                .toInstant();
        CourseLeaveDate leave = courseLeaveDateService.scheduleLeave(userId, scheduledFor);
        return ResponseEntity.ok(leave);
    }

    @GetMapping("/{userId}/schedule-leave/status")
    public ResponseEntity<Map<String, Object>> getLeaveStatus(@PathVariable UUID userId) {
        Optional<CourseLeaveDate> record = courseLeaveDateService.findByUserId(userId);
        if (record.isPresent()) {
            CourseLeaveDate leave = record.get();
            Map<String, Object> response = new HashMap<>();
            response.put("executed", leave.getExecutedAt() != null);
            response.put("scheduledFor", leave.getScheduledFor());
            if (leave.getExecutedAt() != null) {
                response.put("executedAt", leave.getExecutedAt());
            }
            return ResponseEntity.ok(response);
        }
        return ResponseEntity.ok(Map.of("executed", false));
    }
}