package com.atama.repository;

import com.atama.model.ConceptMap;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface ConceptMapRepository extends JpaRepository<ConceptMap, UUID> {

    @Query("SELECT c FROM ConceptMap c WHERE c.library.id = :libraryId ORDER BY c.createdAt DESC")
    List<ConceptMap> findByLibraryId(@Param("libraryId") UUID libraryId);
}
