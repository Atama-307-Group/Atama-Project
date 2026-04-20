package com.atama.controller;

import com.atama.dto.request.CourseRequestDTO;
import com.atama.dto.request.ReportDTO;
import com.atama.model.Status;
import com.atama.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/reports")
    public ResponseEntity<List<ReportDTO>> getReports() {
        return ResponseEntity.ok(adminService.getPendingReports());
    }

    @PatchMapping("/reports/{id}/dismiss")
    public ResponseEntity<?> dismissReport(@PathVariable UUID id) {
        adminService.resolveReport(id, Status.DISMISSED);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/reports/{id}/resolve")
    public ResponseEntity<?> resolveReport(@PathVariable UUID id) {
        adminService.resolveReport(id, Status.RESOLVED);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/course-requests")
    public ResponseEntity<List<CourseRequestDTO>> getCourseRequests() {
        return ResponseEntity.ok(adminService.getPendingCourseRequests());
    }

    @PatchMapping("/course-requests/{id}/approve")
    public ResponseEntity<?> approveCourseRequest(@PathVariable UUID id) {
        adminService.resolveCourseRequest(id, Status.APPROVED);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/course-requests/{id}/reject")
    public ResponseEntity<?> rejectCourseRequest(@PathVariable UUID id) {
        adminService.resolveCourseRequest(id, Status.REJECTED);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/course-requests/{id}/restore")
    public ResponseEntity<?> restoreCourseRequest(@PathVariable UUID id) {
        adminService.resolveCourseRequest(id, Status.PENDING);
        return ResponseEntity.ok().build();
    }
}