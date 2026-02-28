package com.atama.service;

import com.atama.dto.response.FlashcardSetResponseDTO;
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
    private final LibraryItemService libraryItemService;

    // TODO: the services should return the DTO not the entity
    public FlashcardSetResponseDTO createFlashcardSet(FlashcardSetRequestDTO dto) {
        FlashcardSet entity = mapper.toEntity(dto);
        // entity.setOwnerId(userId); should do something like this but id has to come from auth context
        libraryItemService.initializeLibraryItem(entity, dto); // resolve library, folder, item_type
        FlashcardSet saved = flashcardSetRepository.save(entity);
        return mapper.toResponseDTO(saved);
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
