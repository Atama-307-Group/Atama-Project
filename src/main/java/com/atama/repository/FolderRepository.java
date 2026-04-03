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

    @Query("""
    select f from Folder f
    where lower(f.name) like lower(concat('%', :q, '%'))
    and (f.isPublic = true or f.library.user.id = :userId)
    """)
    List<Folder> searchFolders(@Param("q") String q, @Param("userId") UUID userId);

}
