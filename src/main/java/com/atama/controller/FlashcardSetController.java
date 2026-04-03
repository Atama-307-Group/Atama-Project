package com.atama.controller;

import com.atama.dto.request.FlashcardRequestDTO;
import com.atama.dto.request.FlashcardSetRequestDTO;
import com.atama.dto.request.UpdateMetaRequest;
import com.atama.dto.response.FlashcardResponseDTO;
import com.atama.dto.response.FlashcardSetResponseDTO;
import com.atama.service.FileUploadService;
import com.atama.service.FlashcardSetService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.AccessDeniedException;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/flashcard-sets")
@RequiredArgsConstructor
public class FlashcardSetController {

    private final FlashcardSetService flashcardSetService;
    private final FileUploadService fileUploadService;

    @PostMapping
    public ResponseEntity<FlashcardSetResponseDTO> createFlashcardSet(
            @RequestBody FlashcardSetRequestDTO request) {
        UUID userId = getAuthenticatedUserId();
        FlashcardSetResponseDTO saved = flashcardSetService.createFlashcardSet(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @GetMapping("/{id}")
    public ResponseEntity<FlashcardSetResponseDTO> getFlashcardSetById(@PathVariable UUID id) {
        UUID userId = getAuthenticatedUserId();
        return ResponseEntity.ok(flashcardSetService.getFlashcardSetById(id, userId));
    }
    /*public ResponseEntity<FlashcardSetResponseDTO> getFlashcardSetById(@PathVariable UUID id) {
        return ResponseEntity.ok(flashcardSetService.getFlashcardSetById(id));
    }*/

    /*
     * @GetMapping("/owner/{ownerId}")
     * public ResponseEntity<List<FlashcardSetResponseDTO>>
     * getFlashcardSetsByOwner(@PathVariable UUID ownerId) {
     * return
     * ResponseEntity.ok(flashcardSetService.getFlashcardSetsByOwner(ownerId));
     * }
     */

    @GetMapping("/my-sets")
    public ResponseEntity<List<FlashcardSetResponseDTO>> getMyFlashcardSets() {
        UUID userId = getAuthenticatedUserId();
        return ResponseEntity.ok(flashcardSetService.getFlashcardSetsByOwner(userId));
    }

    @GetMapping("/{id}/flashcards")
    public ResponseEntity<List<FlashcardResponseDTO>> getFlashcardsBySetId(@PathVariable UUID id) {
        return ResponseEntity.ok(flashcardSetService.getFlashcardsBySetId(id));
    }

    @PostMapping("/{id}/flashcards")
    public ResponseEntity<FlashcardSetResponseDTO> addFlashcard(@PathVariable UUID id,
            @RequestBody FlashcardRequestDTO flashcardDTO) {
        return ResponseEntity.status(HttpStatus.CREATED).body(flashcardSetService.addFlashcard(id, flashcardDTO));
    }
    // Add this small DTO as a static inner class or its own file

    @PatchMapping("/{id}/meta")
    public ResponseEntity<FlashcardSetResponseDTO> updateMeta(
            @PathVariable UUID id,
            @RequestBody UpdateMetaRequest request) {
        return ResponseEntity.ok(
                flashcardSetService.updateFlashcardSetMeta(id, request.getTitle(), request.getDescription(),
                        request.getUniversity(), request.getCourse()));
    }

    @PatchMapping("/{id}/flashcards/{flashcardId}")
    public ResponseEntity<FlashcardResponseDTO> updateFlashcard(
            @PathVariable UUID id,
            @PathVariable UUID flashcardId,
            @RequestBody FlashcardRequestDTO dto) {
        return ResponseEntity.ok(
                flashcardSetService.updateFlashcard(id, flashcardId, dto));
    }

    @PostMapping("/upload")
    public ResponseEntity<?> uploadFlashcardSet(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "title", required = false) String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "university", required = false) String university,
            @RequestParam(value = "course", required = false) String course) {
        try {
            List<FlashcardRequestDTO> flashcards = fileUploadService.parseFile(file);

            // If no title provided, derive from filename
            if (title == null || title.isBlank()) {
                String originalName = file.getOriginalFilename();
                if (originalName != null) {
                    title = originalName.replaceAll("\\.[^.]+$", ""); // strip extension
                } else {
                    title = "Uploaded Set";
                }
            }

            FlashcardSetRequestDTO request = new FlashcardSetRequestDTO();
            request.setTitle(title.trim());
            request.setDescription(description != null ? description.trim() : "");
            request.setUniversity(university != null ? university.trim() : "");
            request.setCourse(course != null ? course.trim() : "");
            request.setFlashcards(flashcards);

            UUID userId = getAuthenticatedUserId();
            FlashcardSetResponseDTO saved = flashcardSetService.createFlashcardSet(request, userId);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Failed to process file: " + e.getMessage()));
        }
    }

    @PostMapping("/{id}/save")
    public ResponseEntity<Void> saveSet(@PathVariable UUID id) {
        flashcardSetService.saveSet(id, getAuthenticatedUserId());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}/save")
    public ResponseEntity<Void> unsaveSet(@PathVariable UUID id) {
        flashcardSetService.unsaveSet(id, getAuthenticatedUserId());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/saved")
    public ResponseEntity<List<FlashcardSetResponseDTO>> getSavedSets() {
        return ResponseEntity.ok(flashcardSetService.getSavedSets(getAuthenticatedUserId()));
    }

    @PatchMapping("/{id}/privacy")
    public ResponseEntity<FlashcardSetResponseDTO> updatePrivacy(
            @PathVariable UUID id,
            @RequestBody Map<String, Boolean> body) throws AccessDeniedException {
        boolean isPublic = body.get("isPublic");
        return ResponseEntity.ok(flashcardSetService.updatePrivacy(id, isPublic, getAuthenticatedUserId()));
    }

    private UUID getAuthenticatedUserId() {
        /*String userId = (String) SecurityContextHolder.getContext()
                .getAuthentication()
                .getPrincipal();
        return UUID.fromString(userId);*/
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return null;
        }
        return UUID.fromString((String) auth.getPrincipal());    }
}
