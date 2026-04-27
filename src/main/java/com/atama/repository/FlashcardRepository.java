package com.atama.repository;

import com.atama.model.Flashcard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FlashcardRepository extends JpaRepository<Flashcard, UUID> {
    List<Flashcard> findByFlashcardSetId(UUID flashcardSetId);

    @Query("SELECT COUNT(f) FROM Flashcard f WHERE f.flashcardSet.id = :setId")
    long countByFlashcardSetId(UUID setId);
}
