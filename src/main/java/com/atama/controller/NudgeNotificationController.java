package com.atama.controller;

import com.atama.model.NudgeNotification;
import com.atama.repository.NudgeNotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NudgeNotificationController {

    private final NudgeNotificationRepository nudgeNotificationRepository;

    @GetMapping("/nudges/{userId}")
    @Transactional
    public ResponseEntity<List<NudgeNotification>> getPendingNudges(@PathVariable UUID userId) {
        List<NudgeNotification> pending = nudgeNotificationRepository.findByUserIdOrderByCreatedAtAsc(userId);
        nudgeNotificationRepository.deleteByUserId(userId);
        return ResponseEntity.ok(pending);
    }
}
