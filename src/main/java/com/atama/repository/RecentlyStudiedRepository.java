package com.atama.repository;

import com.atama.model.RecentlyStudied;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface RecentlyStudiedRepository extends JpaRepository<RecentlyStudied, UUID> {

    @Query("SELECT r FROM RecentlyStudied r WHERE r.userId = :userId ORDER BY r.accessedAt DESC")
    List<RecentlyStudied> findTop10ByUserIdOrderByAccessedAtDesc(UUID userId);

    long countByUserId(UUID userId);

    @Query("SELECT r FROM RecentlyStudied r WHERE r.userId = :userId ORDER BY r.accessedAt ASC")
    List<RecentlyStudied> findByUserIdOrderByAccessedAtAsc(UUID userId);

    boolean existsByUserIdAndLibraryItemId(UUID userId, UUID libraryItemId);
}