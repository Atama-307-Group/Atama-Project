package com.atama.controller;

import com.atama.dto.request.CreateFolderRequest;
import com.atama.dto.request.RenameFolderRequest;
import com.atama.dto.request.SetFolderStarredRequest;
import com.atama.dto.response.FolderResponse;
import com.atama.model.Folder;
import com.atama.service.FolderService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.List;

@RestController
@RequestMapping("/folders")
public class FolderController {

    private final FolderService folderService;

    public FolderController(FolderService folderService) {
        this.folderService = folderService;
    }

    private static FolderResponse toResponse(Folder saved) {
        return new FolderResponse(
                saved.getId(),
                saved.getName(),
                saved.isStarred(),
                saved.getCreatedAt(),
                saved.getLastAccessed(),
                saved.getItems(),
                saved.getLibrary().getId()
        );
    }

    @PostMapping
    public ResponseEntity<FolderResponse> createFolder(@RequestBody CreateFolderRequest request) {
        Folder saved = folderService.createFolder(request);
        return ResponseEntity.ok(toResponse(saved));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFolder(@PathVariable Long id) {
        folderService.deleteFolder(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/rename")
    public ResponseEntity<Folder> renameFolder(
            @PathVariable Long id,
            @RequestBody RenameFolderRequest request
    ) {
        Folder renamed = folderService.renameFolder(id, request.newName());
        return ResponseEntity.ok(renamed);
    }

    // Set explicitly (star or unstar)
    @PatchMapping("/{id}/starred")
    public ResponseEntity<Folder> setStarred(
            @PathVariable Long id,
            @RequestBody SetFolderStarredRequest request
    ) {
        Folder updated = folderService.setFolderStarred(id, request.starred());
        return ResponseEntity.ok(updated);
    }

    // Optional: toggle endpoint (no body)
    @PostMapping("/{id}/starred/toggle")
    public ResponseEntity<Folder> toggleStarred(@PathVariable Long id) {
        Folder updated = folderService.toggleFolderStarred(id);
        return ResponseEntity.ok(updated);
    }

    @GetMapping
    public ResponseEntity<List<Folder>> getAllFolders() {
        return ResponseEntity.ok(folderService.getAllFolders());
    }
}