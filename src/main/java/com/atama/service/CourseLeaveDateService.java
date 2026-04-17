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

    public CourseLeaveDate scheduleLeave(UUID userId, Instant scheduledFor) {
        courseLeaveDateRepository.findByUserIdAndExecutedAtIsNull(userId)
                .ifPresent(existing -> {
                    System.out.println("Deleting existing leave: " + existing.getId());
                    courseLeaveDateRepository.delete(existing);
                });

        CourseLeaveDate leave = new CourseLeaveDate(userId, scheduledFor);
        return courseLeaveDateRepository.save(leave);
    }

    public Optional<CourseLeaveDate> getRecentlyExecuted(UUID userId) {
        return courseLeaveDateRepository.findByUserIdAndExecutedAtIsNotNull(userId);
    }
}