package com.atama.repository;

import com.atama.model.ExamCountdown;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface ExamCountdownRepository extends JpaRepository<ExamCountdown, UUID> {

    List<ExamCountdown> findByUserId(UUID userId);

    void deleteByUserIdAndExamDateTimeBefore(UUID userId, Instant now);

    @Query("SELECT c FROM ExamCountdown c JOIN FETCH c.user WHERE c.notifyByEmail = true AND c.emailReminderSent = false")
    List<ExamCountdown> findByNotifyByEmailTrueAndEmailReminderSentFalse();
}
