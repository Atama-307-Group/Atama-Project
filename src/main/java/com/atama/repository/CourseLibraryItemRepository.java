package com.atama.repository;

import com.atama.model.CourseLibraryItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CourseLibraryItemRepository extends JpaRepository<CourseLibraryItem, UUID> {
    List<CourseLibraryItem> findByCourseId(UUID courseId);
    List<CourseLibraryItem> findByLibraryItemId(UUID libraryItemId);
}