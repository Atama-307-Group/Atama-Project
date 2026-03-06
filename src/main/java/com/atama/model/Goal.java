package com.atama.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.DayOfWeek;
import java.time.Duration;
import java.time.Instant;
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

    private Set<DayOfWeek> selectedDaysOfWeek;  // Which days the User wants to study

    // For tracking the User's study time
    private Instant studyStartTime;

    @Column(nullable = false, columnDefinition = "bigint default 0")
    private long totalStudyMinutes = 0;

    @Column(nullable = false)
    private int minutesPerDay;

    private java.time.LocalDate lastResetDate;

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
}
