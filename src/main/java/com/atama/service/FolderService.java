package com.atama.service;

import com.atama.dto.request.CreateFolderRequest;
import com.atama.model.Folder;
import com.atama.model.Library;
import com.atama.model.LibraryItem;
import com.atama.repository.FolderRepository;
import com.atama.repository.LibraryRepository;
import com.atama.repository.LibraryItemRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.List;

@Service
public class FolderService {

    private final FolderRepository folderRepository;
    private final LibraryRepository libraryRepository;

    public FolderService(FolderRepository folderRepository, LibraryRepository libraryRepository) {
        this.folderRepository = folderRepository;
        this.libraryRepository = libraryRepository;
    }

    public Folder createFolder(CreateFolderRequest request) {
        Library library = libraryRepository.findById(request.libraryId())
                .orElseThrow(() -> new RuntimeException("Library not found"));

        Folder folder = new Folder();
        folder.setName(request.name());
        folder.setLibrary(library);
        folder.setStarred(false);
        folder.setCreatedAt(OffsetDateTime.now().toInstant());
        folder.setLastAccessed(OffsetDateTime.now().toInstant());

        return folderRepository.save(folder);
    }

    @Transactional
    public void deleteFolder(Long folderId) {
        Folder folder = folderRepository.findById(folderId)
                .orElseThrow(() -> new IllegalArgumentException("Folder not found: " + folderId));

        // TODO figure out wtf
        // Unassign items so FK doesn't block delete (and we don't delete content)
        List<LibraryItem> items = libraryItemRepository.findAllByFolder_Id(folderId);
        for (LibraryItem item : items) {
            item.setFolder(null);
        }
        libraryItemRepository.saveAll(items);

        folderRepository.delete(folder);
    }
}