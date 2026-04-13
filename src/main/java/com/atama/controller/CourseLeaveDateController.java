package com.atama.controller;

import com.atama.model.CourseLeaveDate;
import com.atama.service.CourseLeaveDateService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
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
        LocalDateTime scheduledFor = OffsetDateTime.parse(body.get("scheduledFor"))
                .toLocalDateTime();
        CourseLeaveDate leave = courseLeaveDateService.scheduleLeave(userId, scheduledFor);
        return ResponseEntity.ok(leave);
    }


}