package com.atama.repository;

import com.atama.model.SetStudyTime;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface SetStudyTimeRepository extends JpaRepository<SetStudyTime, UUID> {
    Optional<SetStudyTime> findByUserIdAndFlashcardSet_Id(UUID userId, UUID setId);
}