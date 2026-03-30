package com.atama.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@DiscriminatorValue("FLASHCARD_SET")
@Getter
@Setter
@NoArgsConstructor
public class FlashcardSet extends LibraryItem {
    private String description;
    private String university;      // TODO should be university object
    private String course;      // TODO should be course object

    @OneToMany(mappedBy = "flashcardSet", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Flashcard> flashcards = new ArrayList<>();

    public void addFlashcard(Flashcard flashcard) {
        flashcards.add(flashcard);
        flashcard.setFlashcardSet(this);
    }

    @Column(nullable = false) // TODO: should be false or in library item
    private UUID ownerId;
}
