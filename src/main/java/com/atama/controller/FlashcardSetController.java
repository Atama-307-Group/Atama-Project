package com.atama.controller;

import com.atama.dto.request.FlashcardSetRequestDTO;
import com.atama.dto.response.FlashcardSetResponseDTO;
import com.atama.model.Flashcard;
import com.atama.model.FlashcardSet;
import com.atama.service.FlashcardSetService;
import lombok.RequiredArgsConstructor;
//import org.apache.tomcat.util.net.openssl.ciphers.Authentication;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
//import jakarta.validation.Valid;

import java.util.List;

@RestController
@RequestMapping("/api/flashcard-sets")
@RequiredArgsConstructor
public class FlashcardSetController {

    private final FlashcardSetService flashcardSetService;

    @PostMapping
    public ResponseEntity<FlashcardSetResponseDTO> createFlashcardSet(
            @RequestBody FlashcardSetRequestDTO request) {

        FlashcardSetResponseDTO saved = flashcardSetService.createFlashcardSet(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(saved); // hope this is correct
    }
    /*@PostMapping
    public ResponseEntity<FlashcardSet> createFlashcardSet(@RequestBody FlashcardSet flashcardSet) {
        return ResponseEntity.status(HttpStatus.CREATED).body(flashcardSetService.createFlashcardSet(flashcardSet));
    }*/
    /*@PostMapping("/flashcard-sets")
    public ResponseEntity<FlashcardSetResponseDTO> create(
            @RequestBody FlashcardSetRequestDTO dto,
            Authentication authentication
    ) {
        CustomUserDetails user = (CustomUserDetails) authentication.getPrincipal();
        Long userId = user.getId();

        return ResponseEntity.ok(
                flashcardSetService.createFlashcardSet(dto, userId)
        );
    }*/

    @GetMapping("/{id}")
    public ResponseEntity<FlashcardSet> getFlashcardSetById(@PathVariable Long id) {
        return ResponseEntity.ok(flashcardSetService.getFlashcardSetById(id));
    }

    @GetMapping("/owner/{ownerId}")
    public ResponseEntity<List<FlashcardSet>> getFlashcardSetsByOwner(@PathVariable Long ownerId) {
        return ResponseEntity.ok(flashcardSetService.getFlashcardSetsByOwner(ownerId));
    }

    @GetMapping("/{id}/flashcards")
    public ResponseEntity<List<Flashcard>> getFlashcardsBySetId(@PathVariable Long id) {
        return ResponseEntity.ok(flashcardSetService.getFlashcardsBySetId(id));
    }

    @PostMapping("/{id}/flashcards")
    public ResponseEntity<FlashcardSet> addFlashcard(@PathVariable Long id, @RequestBody Flashcard flashcard) {
        return ResponseEntity.status(HttpStatus.CREATED).body(flashcardSetService.addFlashcard(id, flashcard));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFlashcardSet(@PathVariable Long id) {
        flashcardSetService.deleteFlashcardSet(id);
        return ResponseEntity.noContent().build();
    }
}
