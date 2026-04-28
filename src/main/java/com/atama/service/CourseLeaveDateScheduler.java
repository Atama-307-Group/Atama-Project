package com.atama.service;

import com.atama.model.CourseLeaveDate;
import com.atama.repository.CourseLeaveDateRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;

@Component
public class CourseLeaveDateScheduler {

    private final CourseLeaveDateRepository courseLeaveDateRepository;
    private final UserService userService;

    public CourseLeaveDateScheduler(CourseLeaveDateRepository courseLeaveDateRepository, UserService userService) {
        this.courseLeaveDateRepository = courseLeaveDateRepository;
        this.userService = userService;
    }

    @Scheduled(cron = "0 0 0 * * *")    // TODO 0 0 0 * * * for leaving at midnight
    public void executeScheduledLeaves() {
        System.out.println("Cron job fired at: " + Instant.now());

        List<CourseLeaveDate> pending = courseLeaveDateRepository
                .findAllByScheduledForLessThanEqualAndExecutedAtIsNull(Instant.now());

        System.out.println("Pending leaves found: " + pending.size());
        for (CourseLeaveDate leave : pending) {
            userService.unenrollFromAllCourses(leave.getUserId());
            leave.setExecutedAt(Instant.now());
            courseLeaveDateRepository.save(leave);
        }
    }
}