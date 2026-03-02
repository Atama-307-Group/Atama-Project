package com.atama.controller;

import com.atama.model.Flashcard;
import com.atama.model.FlashcardSet;
import com.atama.service.FlashcardSetService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/flashcard-sets")
@RequiredArgsConstructor
public class FlashcardSetController {

    private final FlashcardSetService flashcardSetService;

    @PostMapping
    public ResponseEntity<FlashcardSet> createFlashcardSet(@RequestBody FlashcardSet flashcardSet) {
        return ResponseEntity.status(HttpStatus.CREATED).body(flashcardSetService.createFlashcardSet(flashcardSet));
    }

    @GetMapping("/{id}")
    public ResponseEntity<FlashcardSet> getFlashcardSetById(@PathVariable UUID id) {
        return ResponseEntity.ok(flashcardSetService.getFlashcardSetById(id));
    }

    @GetMapping("/owner/{ownerId}")
    public ResponseEntity<List<FlashcardSet>> getFlashcardSetsByOwner(@PathVariable UUID ownerId) {
        return ResponseEntity.ok(flashcardSetService.getFlashcardSetsByOwner(ownerId));
    }

    @GetMapping("/{id}/flashcards")
    public ResponseEntity<List<Flashcard>> getFlashcardsBySetId(@PathVariable UUID id) {
        return ResponseEntity.ok(flashcardSetService.getFlashcardsBySetId(id));
    }

    @PostMapping("/{id}/flashcards")
    public ResponseEntity<FlashcardSet> addFlashcard(@PathVariable UUID id, @RequestBody Flashcard flashcard) {
        return ResponseEntity.status(HttpStatus.CREATED).body(flashcardSetService.addFlashcard(id, flashcard));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFlashcardSet(@PathVariable UUID id) {
        flashcardSetService.deleteFlashcardSet(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/flashcards/{flashcardId}/favorite")
    public ResponseEntity<Flashcard> toggleFavorite(@PathVariable UUID flashcardId) {
        return ResponseEntity.ok(flashcardSetService.toggleFavorite(flashcardId));
    }
}
