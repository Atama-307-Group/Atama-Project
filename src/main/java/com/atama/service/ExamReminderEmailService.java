package com.atama.service;

import com.atama.model.ExamCountdown;
import com.atama.repository.ExamCountdownRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ExamReminderEmailService {

    private final ExamCountdownRepository countdownRepository;
    private final JavaMailSender mailSender;

    /**
     * Runs every minute. For each countdown with email notifications enabled
     * and not yet sent, checks whether the current time is within the reminder
     * window. If so, sends a reminder email.
     */
    @Scheduled(cron = "0 * * * * *")
    @Transactional
    public void sendExamEmailReminders() {
        Instant now = Instant.now();

        System.out.println("[ExamReminder] Checking at " + now);

        List<ExamCountdown> countdowns = countdownRepository.findByNotifyByEmailTrueAndEmailReminderSentFalse().stream()
                .distinct().toList();
        System.out.println("[ExamReminder] Found " + countdowns.size() + " countdown(s) with email enabled & unsent");

        for (ExamCountdown countdown : countdowns) {
            if (countdown.getReminderMinutesBefore() <= 0)
                continue;

            Instant examTime = countdown.getExamDateTime();
            Instant windowStart = examTime.minus(countdown.getReminderMinutesBefore(), ChronoUnit.MINUTES);

            if (now.isAfter(windowStart) && now.isBefore(examTime)) {
                try {
                    String email = countdown.getUser().getEmail();

                    long minutesLeft = ChronoUnit.MINUTES.between(now, examTime);
                    String timeLabel;
                    if (minutesLeft >= 1440) {
                        timeLabel = (minutesLeft / 1440) + " day(s)";
                    } else if (minutesLeft >= 60) {
                        timeLabel = (minutesLeft / 60) + " hour(s) and " + (minutesLeft % 60) + " minute(s)";
                    } else {
                        timeLabel = minutesLeft + " minute(s)";
                    }

                    SimpleMailMessage message = new SimpleMailMessage();
                    message.setTo(email);
                    message.setSubject("Atama - Exam Reminder: " + countdown.getReason() + " \uD83D\uDCDA");
                    message.setText(
                            "Hey there!\n\n" +
                                    "This is a reminder from Atama that your exam is coming up.\n\n" +
                                    "Exam: " + countdown.getReason() + "\n" +
                                    "Time remaining: " + timeLabel + "\n\n" +
                                    "Make sure you're prepared. Good luck!\n\n" +
                                    "— Atama Team");
                    mailSender.send(message);

                    countdown.setEmailReminderSent(true);
                    countdownRepository.save(countdown);

                    System.out.println("[ExamReminder] ✅ Email sent for countdown " + countdown.getId());
                } catch (Exception e) {
                    System.err.println("[ExamReminder] ❌ Failed to send: " + e.getMessage());
                    e.printStackTrace();
                }
            }
        }
    }
}
