package com.atama.service;

import com.atama.model.Goal;
import com.atama.repository.GoalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class StudyReminderService {

    private final GoalRepository goalRepository;
    private final JavaMailSender mailSender;

    /**
     * Runs every minute. For each goal with email notifications enabled,
     * checks whether the current time matches the notification time (to the minute)
     * and today is one of the selected study days. If so, sends a reminder email.
     */
    @Scheduled(cron = "0 * * * * *")
    @Transactional(readOnly = true)
    public void sendStudyReminders() {
        LocalTime now = LocalTime.now().withSecond(0).withNano(0);
        DayOfWeek today = LocalDate.now().getDayOfWeek();

        System.out.println("[StudyReminder] Checking at " + now + " on " + today);

        List<Goal> goals = goalRepository.findByNotifyByEmailTrueWithUser();
        System.out.println("[StudyReminder] Found " + goals.size() + " goal(s) with email enabled");

        for (Goal goal : goals) {
            if (goal.getNotificationTime() == null) {
                System.out.println("[StudyReminder] Skipping goal " + goal.getId() + " — no notification time set");
                continue;
            }
            if (goal.getSelectedDaysOfWeek() == null || !goal.getSelectedDaysOfWeek().contains(today)) {
                System.out.println("[StudyReminder] Skipping goal " + goal.getId() + " — today not a study day");
                continue;
            }

            LocalTime targetTime = goal.getNotificationTime().withSecond(0).withNano(0);
            System.out.println("[StudyReminder] Goal " + goal.getId() + " target=" + targetTime + " now=" + now);

            if (!now.equals(targetTime))
                continue;

            // Time and day match — send the email
            try {
                String email = goal.getUser().getEmail();
                int minutes = goal.getMinutesPerDay();

                SimpleMailMessage message = new SimpleMailMessage();
                message.setTo(email);
                message.setSubject("Atama - Time to Study! \uD83D\uDCDA");
                message.setText(
                        "Hey there!\n\n" +
                                "This is your daily study reminder from Atama.\n\n" +
                                "Your goal for today is " + minutes + " minutes of studying.\n\n" +
                                "Open Atama and start a study session now!\n\n" +
                                "— Atama Team");
                mailSender.send(message);
                System.out.println("[StudyReminder] ✅ Email sent to " + email);
            } catch (Exception e) {
                System.err.println("[StudyReminder] ❌ Failed to send: " + e.getMessage());
                e.printStackTrace();
            }
        }
    }
}
