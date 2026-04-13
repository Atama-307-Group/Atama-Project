package com.atama.repository;

import com.atama.model.CourseLeaveDate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CourseLeaveDateRepository extends JpaRepository<CourseLeaveDate, UUID> {
    Optional<CourseLeaveDate> findByUserIdAndExecutedAtIsNull(UUID userId);
    List<CourseLeaveDate> findAllByScheduledForBeforeAndExecutedAtIsNull(LocalDateTime now);
}