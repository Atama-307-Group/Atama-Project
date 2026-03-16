package com.atama.service;

import com.atama.model.ExamCountdown;
import com.atama.model.User;
import com.atama.repository.ExamCountdownRepository;
import com.atama.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class ExamCountdownService {

    private final ExamCountdownRepository countdownRepository;
    private final UserRepository userRepository;

    public ExamCountdownService(ExamCountdownRepository countdownRepository,
            UserRepository userRepository) {
        this.countdownRepository = countdownRepository;
        this.userRepository = userRepository;
    }

    public List<ExamCountdown> getCountdownsByUserId(UUID userId) {
        return countdownRepository.findByUserId(userId);
    }

    public ExamCountdown createCountdown(UUID userId, String reason,
            Instant examDateTime,
            int reminderMinutesBefore) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        ExamCountdown countdown = new ExamCountdown();
        countdown.setUser(user);
        countdown.setReason(reason);
        countdown.setExamDateTime(examDateTime);
        countdown.setReminderMinutesBefore(reminderMinutesBefore);

        return countdownRepository.save(countdown);
    }

    public void deleteCountdown(UUID countdownId) {
        countdownRepository.deleteById(countdownId);
    }

    @Transactional
    public void deleteExpiredCountdowns(UUID userId) {
        countdownRepository.deleteByUserIdAndExamDateTimeBefore(userId, Instant.now());
    }
}
