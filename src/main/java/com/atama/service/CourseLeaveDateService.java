package com.atama.service;

import com.atama.model.CourseLeaveDate;
import com.atama.repository.CourseLeaveDateRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Service
public class CourseLeaveDateService {

    private final CourseLeaveDateRepository courseLeaveDateRepository;

    public CourseLeaveDateService(CourseLeaveDateRepository courseLeaveDateRepository) {
        this.courseLeaveDateRepository = courseLeaveDateRepository;
    }

    @org.springframework.transaction.annotation.Transactional
    public CourseLeaveDate scheduleLeave(UUID userId, Instant scheduledFor) {
        Optional<CourseLeaveDate> existing = courseLeaveDateRepository.findByUserId(userId);

        if (existing.isPresent()) {
            CourseLeaveDate leave = existing.get();
            leave.setScheduledFor(scheduledFor);
            leave.setExecutedAt(null);
            return courseLeaveDateRepository.save(leave);
        }

        return courseLeaveDateRepository.save(new CourseLeaveDate(userId, scheduledFor));
    }

    public Optional<CourseLeaveDate> getRecentlyExecuted(UUID userId) {
        return courseLeaveDateRepository.findByUserIdAndExecutedAtIsNotNull(userId);
    }

    public Optional<CourseLeaveDate> findByUserId(UUID userId) {
        return courseLeaveDateRepository.findByUserId(userId);
    }
}