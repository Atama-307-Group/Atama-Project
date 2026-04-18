package com.atama.repository;

import com.atama.model.StudyGroup;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface StudyGroupRepository extends JpaRepository<StudyGroup, UUID> {
    List<StudyGroup> findByCourseId(UUID courseId);
    Optional<StudyGroup> findByInviteToken(String inviteToken);
}
