package com.atama.model;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;
@Entity
@Getter
@Setter
@Table(name = "user_saved_sets", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "set_id"}))
public class UserSavedSet {
    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "set_id", nullable = false)
    private FlashcardSet flashcardSet;

    private Instant savedAt = Instant.now();
}