package com.atama.service;

import com.atama.dto.response.FlashcardResponseDTO;
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
    private final FlashcardMapper flashcardMapper;
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
    public FlashcardSetResponseDTO getFlashcardSetById(UUID id) {
        FlashcardSet entity = flashcardSetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("FlashcardSet", "id", id));
        return mapper.toResponseDTO(entity);
    }

    @Transactional(readOnly = true)
    public List<FlashcardSetResponseDTO> getFlashcardSetsByOwner(UUID ownerId) {
        return flashcardSetRepository.findByOwnerId(ownerId)
                .stream()
                .map(mapper::toResponseDTO)
                .toList();
    }

    public FlashcardSetResponseDTO addFlashcard(UUID flashcardSetId, FlashcardRequestDTO flashcardDTO) {
        FlashcardSet set = flashcardSetRepository.findById(flashcardSetId)
                .orElseThrow(() -> new ResourceNotFoundException("FlashcardSet", "id", flashcardSetId));
        // map DTO to entity via flashcardMapper, not raw entity from request
        set.addFlashcard(flashcardMapper.toEntity(flashcardDTO));
        return mapper.toResponseDTO(flashcardSetRepository.save(set));
    }

    @Transactional(readOnly = true)
    public List<FlashcardResponseDTO> getFlashcardsBySetId(UUID flashcardSetId) {
        return flashcardRepository.findByFlashcardSetId(flashcardSetId)
                .stream()
                .map(flashcardMapper::toResponseDTO)
                .toList();
    }
    public FlashcardSetResponseDTO updateFlashcardSetMeta(UUID id, String title, String description, String university, String course) {
        FlashcardSet set = flashcardSetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("FlashcardSet", "id", id));
        if (title != null && !title.isBlank()) set.setTitle(title);
        set.setDescription(description);
        set.setUniversity(university);
        set.setCourse(course);
        return mapper.toResponseDTO(flashcardSetRepository.save(set));
    }

    public FlashcardResponseDTO updateFlashcard(UUID flashcardSetId, UUID flashcardId, FlashcardRequestDTO dto) {
        flashcardSetRepository.findById(flashcardSetId)
                .orElseThrow(() -> new ResourceNotFoundException("FlashcardSet", "id", flashcardSetId));
        Flashcard existing = flashcardRepository.findById(flashcardId)
                .orElseThrow(() -> new ResourceNotFoundException("Flashcard", "id", flashcardId));

        // Replace fields based on type — entity subclass must match DTO subclass
        Flashcard updated = flashcardMapper.applyUpdate(existing, dto);
        return flashcardMapper.toResponseDTO(flashcardRepository.save(updated));
    }

}
