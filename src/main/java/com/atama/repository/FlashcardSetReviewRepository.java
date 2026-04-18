package com.atama.repository;

import com.atama.model.FlashcardSetReview;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FlashcardSetReviewRepository extends JpaRepository<FlashcardSetReview, UUID> {

    Optional<FlashcardSetReview> findByUserIdAndFlashcardSet_Id(UUID userId, UUID setId);

    List<FlashcardSetReview> findByFlashcardSet_Id(UUID setId);
}