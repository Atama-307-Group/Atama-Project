package com.atama.service;

import com.atama.dto.request.CreateFolderRequest;
import com.atama.dto.response.FolderItemsResponse;
import com.atama.model.Folder;
import com.atama.model.Library;
import com.atama.repository.FolderRepository;
import com.atama.repository.LibraryRepository;
import com.atama.repository.LibraryItemRepository;
import jakarta.transaction.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
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

    // TODO need to fix so that the user UUID is sent
    public Folder createFolder(CreateFolderRequest request, UUID userId) {
        //Library library = libraryRepository.findByUserId(UUID.fromString("85a98b1e-9ef8-4615-9d5c-66d3e5c391a1"))
        Library library = libraryRepository.findByUserId(userId)
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
    public Folder renameFolder(UUID folderId, String newName) {
        if (newName == null || newName.trim().isEmpty()) {
            throw new IllegalArgumentException("Folder name cannot be empty");
        }

        Folder folder = folderRepository.findById(folderId)
                .orElseThrow(() -> new RuntimeException("Folder not found"));

        folder.setName(newName.trim());

        return folderRepository.save(folder);
    }

    @Transactional
    public void deleteFolder(UUID folderId) {
        Folder folder = folderRepository.findById(folderId)
                .orElseThrow(() -> new RuntimeException("Folder not found"));

        // 1) Detach all items from this folder
        libraryItemRepository.clearFolderForItems(folderId);

        // 2) Delete the folder
        folderRepository.delete(folder);
    }

    @Transactional
    public Folder setFolderStarred(UUID folderId, boolean starred) {
        Folder folder = folderRepository.findById(folderId)
                .orElseThrow(() -> new RuntimeException("Folder not found"));

        folder.setStarred(starred);
        return folder;
    }

    @Transactional
    public Folder toggleFolderStarred(UUID folderId) {
        Folder folder = folderRepository.findById(folderId)
                .orElseThrow(() -> new RuntimeException("Folder not found"));

        folder.setStarred(!folder.isStarred());
        return folder;
    }

    // Get all Folders TODO maybe fix this later??
    /*public List<Folder> getAllFolders(UUID userId) {
        Library library = libraryRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Library not found"));
        return library.getFolders();
    }*/
    public List<Folder> getAllFolders(UUID userId) {
        Library library = libraryRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Library not found"));
        return folderRepository.findAllByLibraryIdWithItems(library.getId());
    }
    public FolderItemsResponse getFolderItems(UUID folderId) {
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
                        li.getItemType()
                ))
                .toList();

        return new FolderItemsResponse(folder.getId(), folder.getName(), summaries);
    }

    @Transactional
    public Folder setFolderPrivacy(UUID folderId, boolean isPublic) {
        Folder f = folderRepository.findById(folderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        f.setPublic(isPublic);          // or f.setIsPublic(isPublic) depending on your model
        return folderRepository.save(f); // safest, forces DB write
    }
}