package com.atama.service;

import com.atama.dto.request.CreateFolderRequest;
import com.atama.dto.response.FolderItemsResponse;
import com.atama.model.Folder;
import com.atama.model.Library;
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
    private final LibraryItemRepository libraryItemRepository;

    public FolderService(FolderRepository folderRepository, LibraryRepository libraryRepository, LibraryItemRepository libraryItemRepository) {
        this.folderRepository = folderRepository;
        this.libraryRepository = libraryRepository;
        this.libraryItemRepository = libraryItemRepository;
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
    public Folder renameFolder(Long folderId, String newName) {
        if (newName == null || newName.trim().isEmpty()) {
            throw new IllegalArgumentException("Folder name cannot be empty");
        }

        Folder folder = folderRepository.findById(folderId)
                .orElseThrow(() -> new RuntimeException("Folder not found"));

        folder.setName(newName.trim());

        return folderRepository.save(folder);
    }

    @Transactional
    public void deleteFolder(Long folderId) {
        Folder folder = folderRepository.findById(folderId)
                .orElseThrow(() -> new RuntimeException("Folder not found"));

        // 1) Detach all items from this folder
        libraryItemRepository.clearFolderForItems(folderId);

        // 2) Delete the folder
        folderRepository.delete(folder);
    }

    @Transactional
    public Folder setFolderStarred(Long folderId, boolean starred) {
        Folder folder = folderRepository.findById(folderId)
                .orElseThrow(() -> new RuntimeException("Folder not found"));

        folder.setStarred(starred);
        return folder;
    }

    @Transactional
    public Folder toggleFolderStarred(Long folderId) {
        Folder folder = folderRepository.findById(folderId)
                .orElseThrow(() -> new RuntimeException("Folder not found"));

        folder.setStarred(!folder.isStarred());
        return folder;
    }

    // Get all FOlders
    public List<Folder> getAllFolders() {
        return folderRepository.findAll();
    }

    public FolderItemsResponse getFolderItems(Long folderId) {
        Folder folder = folderRepository.findById(folderId)
                .orElseThrow(() -> new IllegalArgumentException("Folder not found"));

        var items = libraryItemRepository.findAllByFolderId(folderId);

        var summaries = items.stream()
                .map(li -> new FolderItemsResponse.LibraryItemSummary(
                        li.getId(),
                        li.getTitle(),
                        li.isStarred(),
                        li.getCreatedAt(),
                        li.getUpdatedAt(),
                        li.getLastAccessed(),
                        li.getItem_type()
                ))
                .toList();

        return new FolderItemsResponse(folder.getId(), folder.getName(), summaries);
    }


}