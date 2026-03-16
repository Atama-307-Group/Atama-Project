package com.atama.repository;

import com.atama.model.ExamCountdown;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface ExamCountdownRepository extends JpaRepository<ExamCountdown, UUID> {

    List<ExamCountdown> findByUserId(UUID userId);

    void deleteByUserIdAndExamDateTimeBefore(UUID userId, Instant now);
}
