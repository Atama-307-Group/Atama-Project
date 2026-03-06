package com.atama.controller;

import com.atama.dto.request.CreateFolderRequest;
import com.atama.dto.request.RenameFolderRequest;
import com.atama.dto.request.SetFolderPrivacyRequest;
import com.atama.dto.request.SetFolderStarredRequest;
import com.atama.dto.response.FolderItemsResponse;
import com.atama.dto.response.FolderResponse;
import com.atama.model.Folder;
import com.atama.model.LibraryItem;
import com.atama.repository.FolderRepository;
import com.atama.service.FolderService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/folders")
public class FolderController {

    private final FolderService folderService;
    private final FolderRepository folderRepository;

    public FolderController(FolderService folderService, FolderRepository folderRepository) {
        this.folderService = folderService;
        this.folderRepository = folderRepository;
    }

    private static FolderResponse toResponse(Folder f) {
        List<LibraryItem> items = f.getItems() == null ? List.of() : f.getItems();

        return new FolderResponse(
                f.getId(),
                f.getName(),
                f.isStarred(),
                f.isPublic(),
                f.getCreatedAt(),
                f.getLastAccessed(),
                items,
                f.getLibrary().getId()
        );
    }

    @PostMapping
    public ResponseEntity<FolderResponse> createFolder(@RequestBody CreateFolderRequest request) {

        Folder saved = folderService.createFolder(request);
        return ResponseEntity.ok(toResponse(saved));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFolder(@PathVariable UUID id) {
        folderService.deleteFolder(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/rename")
    public ResponseEntity<FolderResponse> renameFolder(
            @PathVariable UUID id,
            @RequestBody RenameFolderRequest request
    ) {
        Folder renamed = folderService.renameFolder(id, request.newName());
        return ResponseEntity.ok(toResponse(renamed));
    }

    @PatchMapping("/{id}/starred")
    public ResponseEntity<FolderResponse> setStarred(
            @PathVariable UUID id,
            @RequestBody SetFolderStarredRequest request
    ) {
        Folder updated = folderService.setFolderStarred(id, request.starred());
        return ResponseEntity.ok(toResponse(updated));
    }

    @PostMapping("/{id}/starred/toggle")
    public ResponseEntity<FolderResponse> toggleStarred(@PathVariable UUID id) {
        Folder updated = folderService.toggleFolderStarred(id);
        return ResponseEntity.ok(toResponse(updated));
    }

    // Get all Folders
    @GetMapping
    public ResponseEntity<List<FolderResponse>> getAllFolders() {
        return ResponseEntity.ok(
                folderService.getAllFolders().stream()
                        .map(FolderController::toResponse)
                        .toList()
        );
    }

    // Get all LibraryItems in a Folder
    @GetMapping("/{id}/items")
    public ResponseEntity<FolderItemsResponse> getFolderItems(@PathVariable UUID id) {
        Folder folder = folderRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Folder not found: " + id));

        // For now: always empty
        return ResponseEntity.ok(
                new FolderItemsResponse(folder.getId(), folder.getName(), List.of())
        );
    }

    @PatchMapping("/{id}/privacy")
    public ResponseEntity<FolderResponse> setPrivacy(
            @PathVariable UUID id,
            @RequestBody SetFolderPrivacyRequest request
    ) {
        Folder updated = folderService.setFolderPrivacy(id, request.isPublic());
        return ResponseEntity.ok(toResponse(updated));
    }
}