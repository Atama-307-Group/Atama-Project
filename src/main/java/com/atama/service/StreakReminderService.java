package com.atama.service;

import com.atama.model.Goal;
import com.atama.model.User;
import com.atama.repository.GoalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class StreakReminderService {

    private final GoalRepository goalRepository;
    private final JavaMailSender mailSender;

    // Runs every day at 11:00 PM
    @Scheduled(cron = "0 0 23 * * *")
    public void sendStreakReminders() {
        LocalDate today = LocalDate.now();
        List<Goal> allGoals = goalRepository.findAllWithUser();

        for (Goal goal : allGoals) {
            // Skip users who already studied today
            if (goal.getStudyDates() != null && goal.getStudyDates().contains(today)) {
                continue;
            }

            // Skip users with no streak to protect
            if (goal.getCurrentStreak() == 0) {
                continue;
            }

            User user = goal.getUser();
            if (user == null || user.getEmail() == null)
                continue;

            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setTo(user.getEmail());
                message.setSubject("Atama – Don't break your streak! 🔥");
                message.setText(
                        "Hi " + user.getUsername() + ",\n\n" +
                                "You're on a " + goal.getCurrentStreak() + "-day streak — don't lose it!\n\n" +
                                "You haven't studied yet today. Head over to Atama before midnight to keep your streak alive.\n\n"
                                +
                                "— Atama Team");
                mailSender.send(message);
                System.out.println("Streak reminder sent to " + user.getEmail());
            } catch (Exception e) {
                System.err.println("Failed to send streak reminder to " + user.getEmail() + ": " + e.getMessage());
            }
        }
    }
}