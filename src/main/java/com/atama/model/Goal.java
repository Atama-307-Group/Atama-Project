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

@Entity
@Getter
@Setter
@NoArgsConstructor
public class Goal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @OneToOne(fetch = FetchType.LAZY)
    private User user;



    private Set<DayOfWeek> selectedDaysOfWeek;  // Which days the User wants to study

    // For tracking the User's study time
    private Instant studyStartTime;
    private Duration totalStudyTime = Duration.ZERO;

    // Mark when User starts studying
    public void startStudying() {
        Instant studyStartTime = Instant.now();
    }

    // Call when user leaves studying part of app
    public void stopStudying() {
        if (this.getStudyStartTime() != null) {
            totalStudyTime = totalStudyTime.plus(
                    Duration.between(studyStartTime, Instant.now())
            );
            studyStartTime = null;
        }
    }
}
