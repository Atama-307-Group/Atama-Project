package com.atama.repository;

import com.atama.model.StudySession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface StudySessionRepository extends JpaRepository<StudySession, UUID> {

    @Query("""
        SELECT ss FROM StudySession ss
        WHERE ss.userId IN :userIds
          AND ss.studiedAt >= :weekStart
          AND ss.flashcardSet.id IN (
              SELECT cli.libraryItem.id FROM CourseLibraryItem cli
              WHERE cli.course.id = :courseId
          )
    """)
    List<StudySession> findWeeklySessionsByUsersAndCourse(
            @Param("userIds") List<UUID> userIds,
            @Param("courseId") UUID courseId,
            @Param("weekStart") Instant weekStart
    );
}
