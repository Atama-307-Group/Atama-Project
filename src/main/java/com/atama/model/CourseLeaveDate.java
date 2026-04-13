package com.atama.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Entity
@Table(name = "scheduled_leaves")
public class CourseLeaveDate {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Setter
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Setter
    @Column(name = "scheduled_for", nullable = false)
    private LocalDateTime scheduledFor;

    @Setter
    @Column(name = "executed_at")
    private LocalDateTime executedAt;

    public CourseLeaveDate() {}

    public CourseLeaveDate(UUID userId, LocalDateTime scheduledFor) {
        this.userId = userId;
        this.scheduledFor = scheduledFor;
    }
}