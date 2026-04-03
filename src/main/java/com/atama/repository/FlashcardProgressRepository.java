package com.atama.repository;

import com.atama.model.FlashcardProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FlashcardProgressRepository extends JpaRepository<FlashcardProgress, UUID> {

    Optional<FlashcardProgress> findByUserIdAndFlashcard_Id(UUID userId, UUID flashcardId);

    @Query("SELECT p FROM FlashcardProgress p WHERE p.userId = :userId AND p.flashcard.flashcardSet.id = :setId")
    List<FlashcardProgress> findByUserIdAndSetId(@Param("userId") UUID userId, @Param("setId") UUID setId);
}