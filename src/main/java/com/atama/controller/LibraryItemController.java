package com.atama.controller;

import com.atama.dto.response.LibraryItemResponseDTO;
import com.atama.model.LibraryItem;
import com.atama.model.PDF;
import com.atama.repository.LibraryItemRepository;
import com.atama.service.LibraryItemService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/library-items")
@RequiredArgsConstructor

public class LibraryItemController {

    private final LibraryItemService libraryItemService;
    private final LibraryItemRepository libraryItemRepository;

    private static LibraryItemResponseDTO toResponse(LibraryItem i) {
        return new LibraryItemResponseDTO(
                i.getId(),
                i.getTitle(),
                i.getCreatedAt(),
                i.getUpdatedAt(),
                i.getLastAccessed(),
                i.isStarred(),
                i.getItemType(),
                i.isPublic(),
                i.getFolder() != null ? i.getFolder().getId() : null
        );
    }

    @GetMapping
    public ResponseEntity<List<LibraryItemResponseDTO>> getAllLibraryItems() {
        UUID userId = getAuthenticatedUserId();
        return ResponseEntity.ok(
                libraryItemService.getAllItems(userId).stream()
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

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<LibraryItemResponseDTO> uploadPDF(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "title", required = false) String title
    ) throws IOException {
        UUID userId = getAuthenticatedUserId();
        System.out.println("Authenticated userId: " + userId);
        LibraryItem item = libraryItemService.uploadPDF(file, title, userId);
        return ResponseEntity.ok(toResponse(item));
    }

    @PostMapping(value = "/upload/course", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<LibraryItemResponseDTO> uploadPDFToCourse(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "title", required = false) String title,
            @RequestParam(value = "year", required = false) String year,
            @RequestParam(value = "semester", required = false) String semester,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam("courseId") UUID courseId
    ) throws IOException {
        UUID userId = getAuthenticatedUserId();
        LibraryItem item = libraryItemService.uploadPDFToCourse(file, title, year, semester, description, courseId, userId);
        return ResponseEntity.ok(toResponse(item));
    }

    @PostMapping("/{itemId}/access")
    public ResponseEntity<Void> recordAccess(@PathVariable UUID itemId) {
        libraryItemService.recordAccess(itemId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{itemId}/file")
    public ResponseEntity<org.springframework.core.io.Resource> serveFile(@PathVariable UUID itemId) throws IOException {
        PDF pdf = (PDF) libraryItemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Item not found"));

        Path filePath = Paths.get(pdf.getFilePath());
        Resource resource = new UrlResource(filePath.toUri());

        if (!resource.exists()) throw new RuntimeException("File not found");

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
    }

    @PatchMapping("/{itemId}/star")
    public ResponseEntity<LibraryItemResponseDTO> starItem(@PathVariable UUID itemId) {
        LibraryItem updated = libraryItemService.toggleItemStarred(itemId);
        return ResponseEntity.ok(toResponse(updated));
    }


    private UUID getAuthenticatedUserId() {
        String userId = (String) SecurityContextHolder.getContext()
                .getAuthentication()
                .getPrincipal();
        return UUID.fromString(userId);
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> downloadPDF(@PathVariable UUID id) throws IOException {
        LibraryItem item = libraryItemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Item not found"));

        PDF pdf = (PDF) item;
        Path filePath = Paths.get(pdf.getFilePath());
        Resource resource = new UrlResource(filePath.toUri());

        String filename = (item.getTitle() != null ? item.getTitle() : "document") + ".pdf";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(resource);

    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLibraryItem(@PathVariable UUID id) {
        libraryItemService.deleteLibraryItem(id);
        return ResponseEntity.noContent().build();
    }
}