package com.atama.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.DayOfWeek;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalTime;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class Goal {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @JsonIgnore
    @OneToOne(fetch = FetchType.LAZY)
    private User user;

    private Set<DayOfWeek> selectedDaysOfWeek; // Which days the User wants to study

    // For tracking the User's study time
    private Instant studyStartTime;

    @Column(nullable = false, columnDefinition = "bigint default 0")
    private long totalStudyMinutes = 0;

    @Column(nullable = false)
    private int minutesPerDay;

    private java.time.LocalDate lastResetDate;

    // Notification preferences
    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean notifyByDesktop = false;

    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean notifyByEmail = false;

    private LocalTime notificationTime;

    // Streak fields
    private int currentStreak = 0;

    private java.time.LocalDate lastStudyDate;

    private int bestStreak = 0;

    @ElementCollection(fetch = FetchType.EAGER) // Eager ensures dates are loaded for the streak calculation
    @CollectionTable(name = "goal_study_dates", joinColumns = @JoinColumn(name = "goal_id"))
    @Column(name = "study_date")
    private List<LocalDate> studyDates = new ArrayList<>();

    // Mark when User starts studying
    public void startStudying() {
        this.studyStartTime = Instant.now();
    }

    // Call when user leaves studying part of app
    public void stopStudying() {
        if (this.studyStartTime != null) {
            long minutesElapsed = Duration.between(studyStartTime, Instant.now()).toMinutes();
            totalStudyMinutes += minutesElapsed;
            studyStartTime = null;
        }
    }

    public int getEffectiveCurrentStreak() {
        if (currentStreak == 0) return 0;
        if (lastStudyDate == null) return 0;

        LocalDate today = LocalDate.now();
        // Streak is still alive if they studied today or yesterday
        if (lastStudyDate.equals(today) || lastStudyDate.equals(today.minusDays(1))) {
            return currentStreak;
        }
        // Missed a day — streak is broken
        return 0;
    }
}
