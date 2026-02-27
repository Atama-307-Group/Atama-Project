package com.atama.repository;

import com.atama.model.LibraryItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface LibraryItemRepository extends JpaRepository<LibraryItem, Long> {

    @Modifying
    @Query("update LibraryItem li set li.folder = null where li.folder.id = :folderId")
    void clearFolderForItems(@Param("folderId") Long folderId);

}