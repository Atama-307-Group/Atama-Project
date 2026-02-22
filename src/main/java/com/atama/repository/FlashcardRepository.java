package com.atama.repository;

import com.atama.model.Flashcard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FlashcardRepository extends JpaRepository<Flashcard, Long> {
    List<Flashcard> findByFlashcardSetId(Long flashcardSetId);
}
