package com.atama.repository;

import com.atama.model.LibraryItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LibraryItemRepository extends JpaRepository<LibraryItem, Long> {
    List<LibraryItem> findAllByFolder_Id(Long folderId);
}