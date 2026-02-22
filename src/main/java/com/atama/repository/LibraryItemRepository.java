package com.atama.repository;

import com.atama.model.LibraryItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface LibraryItemRepository extends JpaRepository<LibraryItem, Long> {
    Optional<LibraryItem> findByIdAndLibrary_User_Id(Long id, Long userId);
}