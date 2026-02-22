package com.atama.controller;

import com.atama.dto.request.CreateFolderRequest;
import com.atama.dto.response.FolderResponse;
import com.atama.model.Folder;
import com.atama.service.FolderService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/folders")
public class FolderController {

    private final FolderService folderService;

    public FolderController(FolderService folderService) {
        this.folderService = folderService;
    }

    @PostMapping
    public ResponseEntity<FolderResponse> createFolder(@RequestBody CreateFolderRequest request) {
        Folder saved = folderService.createFolder(request);

        FolderResponse response = new FolderResponse(
                saved.getId(),
                saved.getName(),
                saved.getCreatedAt(),
                saved.getLastAccessed(),
                saved.getLibrary().getId()
        );

        return ResponseEntity.ok(response);
    }
}