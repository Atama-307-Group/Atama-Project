package com.atama.service;

import com.atama.controller.GoalController.UpdateGoalRequest;
import com.atama.model.Goal;
import com.atama.model.User;
import com.atama.repository.GoalRepository;
import com.atama.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class GoalService {

    private final GoalRepository goalRepository;
    private final UserRepository userRepository;

    public GoalService(GoalRepository goalRepository, UserRepository userRepository) {
        this.goalRepository = goalRepository;
        this.userRepository = userRepository;
    }

    public Goal getGoalByUserId(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
        return user.getGoal();
    }

    public Goal updateGoal(UUID userId, UpdateGoalRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        Goal goal = user.getGoal();
        if (goal == null) {
            goal = new Goal();
            goal.setUser(user);
        }

        goal.setSelectedDaysOfWeek(request.selectedDaysOfWeek());
        goal.setMinutesPerDay((int) request.minutesPerDay());

        if (request.notifyByDesktop() != null) {
            goal.setNotifyByDesktop(request.notifyByDesktop());
        }
        if (request.notifyByEmail() != null) {
            goal.setNotifyByEmail(request.notifyByEmail());
        }
        if (request.notificationTime() != null) {
            goal.setNotificationTime(request.notificationTime());
        }

        return goalRepository.save(goal);
    }

    public void startStudying(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
        Goal goal = user.getGoal();

        // Reset if it's a new day
        if (goal.getLastResetDate() == null || !goal.getLastResetDate().equals(java.time.LocalDate.now())) {
            goal.setTotalStudyMinutes(0);
            goal.setLastResetDate(java.time.LocalDate.now());
        }
        System.out.println("startStudying called for userId: " + userId);
        System.out.println("studyStartTime set to: " + goal.getStudyStartTime());
        goal.startStudying();
        goalRepository.save(goal);
    }

    public void stopStudying(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
        user.getGoal().stopStudying();
        goalRepository.save(user.getGoal());
    }
}