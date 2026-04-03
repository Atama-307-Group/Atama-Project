package com.atama.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(
        name = "flashcard_progress",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "flashcard_id"})
)
@Getter
@Setter
@NoArgsConstructor
public class FlashcardProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "flashcard_id", nullable = false)
    private Flashcard flashcard;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private KnowledgeLevel knowledgeLevel = KnowledgeLevel.DONT_KNOW;

    public enum KnowledgeLevel {
        DONT_KNOW, KNOW_SOMEWHAT, KNOW_WELL
    }
}