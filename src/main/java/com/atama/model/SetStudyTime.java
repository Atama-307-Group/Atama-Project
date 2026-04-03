package com.atama.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(
        name = "set_study_time",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "flashcard_set_id"})
)
@Getter
@Setter
@NoArgsConstructor
public class SetStudyTime {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "flashcard_set_id", nullable = false)
    private FlashcardSet flashcardSet;

    @Column(nullable = false)
    private long studySeconds = 0;
}