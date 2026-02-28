package com.atama.service;

import com.atama.exception.ResourceNotFoundException;
import com.atama.model.*;
import com.atama.repository.*;
import com.atama.mapper.*;
import com.atama.dto.request.*;
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
    private final FlashcardSetMapper mapper;


    public FlashcardSet createFlashcardSet(FlashcardSetRequestDTO dto) {
        FlashcardSet entity = mapper.toEntity(dto);
        return flashcardSetRepository.save(entity);
    }

    @Transactional(readOnly = true)
    public FlashcardSet getFlashcardSetById(Long id) {
        return flashcardSetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("FlashcardSet", "id", id));
    }

    @Transactional(readOnly = true)
    public List<FlashcardSet> getFlashcardSetsByOwner(Long ownerId) {
        return flashcardSetRepository.findByOwnerId(ownerId);
    }

    public FlashcardSet addFlashcard(Long flashcardSetId, Flashcard flashcard) {
        FlashcardSet set = getFlashcardSetById(flashcardSetId);
        set.addFlashcard(flashcard);
        return flashcardSetRepository.save(set);
    }

    public void deleteFlashcardSet(Long id) {
        if (!flashcardSetRepository.existsById(id)) {
            throw new ResourceNotFoundException("FlashcardSet", "id", id);
        }
        flashcardSetRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<Flashcard> getFlashcardsBySetId(Long flashcardSetId) {
        return flashcardRepository.findByFlashcardSetId(flashcardSetId);
    }
}
