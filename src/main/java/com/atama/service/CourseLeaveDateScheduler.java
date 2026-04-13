package com.atama.service;

import com.atama.model.CourseLeaveDate;
import com.atama.repository.CourseLeaveDateRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class CourseLeaveDateScheduler {

    private final CourseLeaveDateRepository courseLeaveDateRepository;
    private final UserService userService;

    public CourseLeaveDateScheduler(CourseLeaveDateRepository courseLeaveDateRepository, UserService userService) {
        this.courseLeaveDateRepository = courseLeaveDateRepository;
        this.userService = userService;
    }

    @Scheduled(cron = "0 0 0 * * *")
    public void executeScheduledLeaves() {
        List<CourseLeaveDate> pending = courseLeaveDateRepository
                .findAllByScheduledForBeforeAndExecutedAtIsNull(LocalDateTime.now());

        for (CourseLeaveDate leave : pending) {
            userService.unenrollFromAllCourses(leave.getUserId());
            leave.setExecutedAt(LocalDateTime.now());
            courseLeaveDateRepository.save(leave);
        }
    }
}