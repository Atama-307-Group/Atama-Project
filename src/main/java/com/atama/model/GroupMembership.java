package com.atama.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
        name = "group_memberships",
        uniqueConstraints = @UniqueConstraint(columnNames = {"group_id", "user_id"})
)
@Getter
@Setter
@NoArgsConstructor
public class GroupMembership {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "group_id", nullable = false)
    private StudyGroup group;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role = Role.MEMBER;

    @Column(nullable = false, updatable = false)
    private Instant joinedAt = Instant.now();

    public enum Role {
        OWNER, MEMBER
    }
}