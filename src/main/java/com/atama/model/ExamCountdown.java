package com.atama.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "exam_countdowns")
@Getter
@Setter
@NoArgsConstructor
public class ExamCountdown {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String reason;

    @Column(nullable = false)
    private Instant examDateTime;

    @Column(nullable = false)
    private int reminderMinutesBefore = 60;

    @Column(nullable = false, columnDefinition = "boolean default true")
    private boolean notifyByDesktop = true;

    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean notifyByEmail = false;

    /**
     * Tracks whether the email reminder has already been sent for this countdown
     */
    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean emailReminderSent = false;
}
