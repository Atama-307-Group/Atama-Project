package com.atama.controller;

import com.atama.dto.request.FlashcardRequestDTO;
import com.atama.dto.request.FlashcardSetRequestDTO;
import com.atama.dto.request.UpdateMetaRequest;
import com.atama.dto.response.FlashcardResponseDTO;
import com.atama.dto.response.FlashcardSetResponseDTO;
import com.atama.service.FlashcardSetService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;


import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/flashcard-sets")
@RequiredArgsConstructor
public class FlashcardSetController {

    private final FlashcardSetService flashcardSetService;

    @PostMapping
    public ResponseEntity<FlashcardSetResponseDTO> createFlashcardSet(
            @RequestBody FlashcardSetRequestDTO request) {
        UUID userId = getAuthenticatedUserId();
        FlashcardSetResponseDTO saved = flashcardSetService.createFlashcardSet(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @GetMapping("/{id}")
    public ResponseEntity<FlashcardSetResponseDTO> getFlashcardSetById(@PathVariable UUID id) {
        return ResponseEntity.ok(flashcardSetService.getFlashcardSetById(id));
    }

    /*@GetMapping("/owner/{ownerId}")
    public ResponseEntity<List<FlashcardSetResponseDTO>> getFlashcardSetsByOwner(@PathVariable UUID ownerId) {
        return ResponseEntity.ok(flashcardSetService.getFlashcardSetsByOwner(ownerId));
    }*/

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
    public ResponseEntity<FlashcardSetResponseDTO> addFlashcard(@PathVariable UUID id, @RequestBody FlashcardRequestDTO flashcardDTO) {
        return ResponseEntity.status(HttpStatus.CREATED).body(flashcardSetService.addFlashcard(id, flashcardDTO));
    }
    // Add this small DTO as a static inner class or its own file

    @PatchMapping("/{id}/meta")
    public ResponseEntity<FlashcardSetResponseDTO> updateMeta(
            @PathVariable UUID id,
            @RequestBody UpdateMetaRequest request) {
        return ResponseEntity.ok(
                flashcardSetService.updateFlashcardSetMeta(id, request.getTitle(), request.getDescription(), request.getUniversity(), request.getCourse())
        );
    }

    @PatchMapping("/{id}/flashcards/{flashcardId}")
    public ResponseEntity<FlashcardResponseDTO> updateFlashcard(
            @PathVariable UUID id,
            @PathVariable UUID flashcardId,
            @RequestBody FlashcardRequestDTO dto) {
        return ResponseEntity.ok(
                flashcardSetService.updateFlashcard(id, flashcardId, dto)
        );
    }

    private UUID getAuthenticatedUserId() {
        String userId = (String) SecurityContextHolder.getContext()
                .getAuthentication()
                .getPrincipal();
        return UUID.fromString(userId);
    }
}

