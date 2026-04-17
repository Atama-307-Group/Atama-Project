package com.atama.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
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
    private Instant scheduledFor;

    @Setter
    @Column(name = "executed_at")
    private Instant executedAt;

    public CourseLeaveDate() {}

    public CourseLeaveDate(UUID userId, Instant scheduledFor) {
        this.userId = userId;
        this.scheduledFor = scheduledFor;
    }
}