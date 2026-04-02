package com.atama.repository;

import com.atama.model.Folder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FolderRepository extends JpaRepository<Folder, UUID> {
    // List<Folder> findByLibraryId(Long libraryId);
        @Query("SELECT f FROM Folder f LEFT JOIN FETCH f.items WHERE f.library.id = :libraryId")
        List<Folder> findAllByLibraryIdWithItems(@Param("libraryId") UUID libraryId);

}
