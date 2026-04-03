package com.atama.repository;

import com.atama.model.UserSavedSet;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserSavedSetRepository extends JpaRepository<UserSavedSet, UUID> {
    List<UserSavedSet> findByUserId(UUID userId);
    Optional<UserSavedSet> findByUserIdAndFlashcardSetId(UUID userId, UUID setId);
    boolean existsByUserIdAndFlashcardSetId(UUID userId, UUID setId);
    void deleteByUserIdAndFlashcardSetId(UUID userId, UUID setId);
}