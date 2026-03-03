package com.atama.service;

import com.atama.exception.ResourceNotFoundException;
import com.atama.repository.*;
import com.atama.model.*;
import com.atama.dto.request.*;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class LibraryItemService {

    private final LibraryRepository libraryRepository;
    private final FolderRepository folderRepository;


    public void initializeLibraryItem(LibraryItem item, LibraryItemRequestDTO dto) {
        item.setTitle(dto.getTitle());
        item.setItem_type(resolveItemType(item));
    }
    // for when we start actually using id
    /*public void initializeLibraryItem(LibraryItem item, LibraryItemRequestDTO dto, Long userId) {
        Library library = libraryRepository.findByOwnerId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Library not found for user"));

        item.setLibrary(library);
        item.setItem_type(resolveItemType(item));

        if (dto.getFolderId() != null) {
            Folder folder = folderRepository.findById(dto.getFolderId())
                    .orElseThrow(() -> new ResourceNotFoundException("Folder not found"));
            // optionally verify folder belongs to same library
            item.setFolder(folder);
        }
    }*/

    private LibraryItemType resolveItemType(LibraryItem item) {
        if (item instanceof FlashcardSet) return LibraryItemType.FLASHCARD_SET;
        // add other subtypes
        throw new IllegalArgumentException("Unknown LibraryItem subtype: " + item.getClass());
    }
}