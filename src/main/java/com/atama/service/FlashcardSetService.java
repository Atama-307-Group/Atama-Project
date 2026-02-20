package com.atama.service;

import com.atama.exception.ResourceNotFoundException;
import com.atama.model.Flashcard;
import com.atama.model.FlashcardSet;
import com.atama.repository.FlashcardRepository;
import com.atama.repository.FlashcardSetRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class FlashcardSetService {

    private final FlashcardSetRepository flashcardSetRepository;
    private final FlashcardRepository flashcardRepository;

    public FlashcardSet createFlashcardSet(FlashcardSet flashcardSet) {
        return flashcardSetRepository.save(flashcardSet);
    }

    @Transactional(readOnly = true)
    public FlashcardSet getFlashcardSetById(UUID id) {
        return flashcardSetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("FlashcardSet", "id", id));
    }

    @Transactional(readOnly = true)
    public List<FlashcardSet> getFlashcardSetsByOwner(UUID ownerId) {
        return flashcardSetRepository.findByOwnerId(ownerId);
    }

    public FlashcardSet addFlashcard(UUID flashcardSetId, Flashcard flashcard) {
        FlashcardSet set = getFlashcardSetById(flashcardSetId);
        set.addFlashcard(flashcard);
        return flashcardSetRepository.save(set);
    }

    public void deleteFlashcardSet(UUID id) {
        if (!flashcardSetRepository.existsById(id)) {
            throw new ResourceNotFoundException("FlashcardSet", "id", id);
        }
        flashcardSetRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<Flashcard> getFlashcardsBySetId(UUID flashcardSetId) {
        return flashcardRepository.findByFlashcardSetId(flashcardSetId);
    }
}
