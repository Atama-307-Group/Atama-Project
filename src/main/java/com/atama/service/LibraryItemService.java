package com.atama.service;

import com.atama.exception.ResourceNotFoundException;
import com.atama.model.LibraryItem;
import com.atama.repository.LibraryItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LibraryItemService {

    private final LibraryItemRepository libraryItemRepository;

    @Transactional
    public void removeItemFromFolder(UUID userId, UUID itemId) {
        LibraryItem item = libraryItemRepository
                .findByIdAndLibrary_User_Id(itemId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("LibraryItem", "id", itemId));

        if (item.getFolder() != null) {
            // keep inverse side consistent in memory (optional but good practice)
            item.getFolder().getItems().remove(item);

            // owning side update (this is what updates folder_id in DB)
            item.setFolder(null);
        }
    }
}