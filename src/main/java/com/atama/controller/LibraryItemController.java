package com.atama.controller;

import com.atama.dto.response.LibraryItemResponseDTO;
import com.atama.model.LibraryItem;
import com.atama.service.LibraryItemService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/library-items")
@RequiredArgsConstructor

public class LibraryItemController {

    private final LibraryItemService libraryItemService;

    private static LibraryItemResponseDTO toResponse(LibraryItem i) {
        return new LibraryItemResponseDTO(
                i.getId(),
                i.getTitle(),
                i.getCreatedAt(),
                i.getUpdatedAt(),
                i.getLastAccessed(),
                i.isStarred(),
                i.getItemType(),
                i.getFolder() != null ? i.getFolder().getId() : null
        );
    }

    @GetMapping
    public ResponseEntity<List<LibraryItemResponseDTO>> getAllLibraryItems() {
        return ResponseEntity.ok(
                libraryItemService.getAllItems().stream()
                        .map(LibraryItemController::toResponse)
                        .toList()
        );
    }

    @PatchMapping("/{itemId}/folder")
    public ResponseEntity<LibraryItemResponseDTO> moveToFolder(
            @PathVariable UUID itemId,
            @RequestBody Map<String, UUID> body) {
        System.out.println("moveToFolder called with itemId: " + itemId);
        System.out.println("body: " + body);
        UUID folderId = body.get("folderId");
        System.out.println("folderId: " + folderId);
        LibraryItem updated = libraryItemService.moveToFolder(itemId, folderId);
        return ResponseEntity.ok(toResponse(updated));
    }

    @DeleteMapping("/{itemId}/folder")
    public ResponseEntity<LibraryItemResponseDTO> removeFromFolder(@PathVariable UUID itemId) {
        LibraryItem updated = libraryItemService.removeFromFolder(itemId);
        return ResponseEntity.ok(toResponse(updated));
    }
}