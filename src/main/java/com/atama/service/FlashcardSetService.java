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

import java.nio.file.AccessDeniedException;
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
    private final UserSavedSetRepository userSavedSetRepository;
    private final FlashcardSetReviewService reviewService;

    // TODO: the services should return the DTO not the entity
    public FlashcardSetResponseDTO createFlashcardSet(FlashcardSetRequestDTO dto, UUID userId) {
        FlashcardSet entity = mapper.toEntity(dto);
        entity.setOwnerId(userId);
        entity.setPublic(dto.isPublic());
        libraryItemService.initializeLibraryItem(entity, dto, userId); // resolve library, folder, item_type
        FlashcardSet saved = flashcardSetRepository.save(entity);
        return mapper.toResponseDTO(saved);
    }

    /*@Transactional(readOnly = true)
    public FlashcardSetResponseDTO getFlashcardSetById(UUID id) {
        FlashcardSet entity = flashcardSetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("FlashcardSet", "id", id));
        return mapper.toResponseDTO(entity);
    }*/
    @Transactional(readOnly = true)
    public FlashcardSetResponseDTO getFlashcardSetById(UUID id, UUID requesterId) {
        FlashcardSet entity = flashcardSetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("FlashcardSet", "id", id));

        FlashcardSetResponseDTO dto = mapper.toResponseDTO(entity);

        // From HEAD: owner/saved metadata
        dto.setIsOwner(requesterId != null && requesterId.equals(entity.getOwnerId()));
        dto.setIsSaved(requesterId != null && userSavedSetRepository.existsByUserIdAndFlashcardSetId(requesterId, entity.getId()));

        // From main: review aggregates
        FlashcardSetReviewService.ReviewAggregate agg = reviewService.getAggregate(id);
        dto.setAverageRating(agg.averageStars());
        dto.setTopTags(agg.topTags());
        dto.setReviewCount(agg.reviewCount());

        return dto;
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

    public void saveSet(UUID setId, UUID userId) {
        if (userSavedSetRepository.existsByUserIdAndFlashcardSetId(userId, setId)) return;
        FlashcardSet set = flashcardSetRepository.findById(setId)
                .orElseThrow(() -> new ResourceNotFoundException("FlashcardSet", "id", setId));
        UserSavedSet saved = new UserSavedSet();
        saved.setUserId(userId);
        saved.setFlashcardSet(set);
        userSavedSetRepository.save(saved);
    }

    @Transactional
    public void unsaveSet(UUID setId, UUID userId) {
        userSavedSetRepository.deleteByUserIdAndFlashcardSetId(userId, setId);
    }

    public List<FlashcardSetResponseDTO> getSavedSets(UUID userId) {
        return userSavedSetRepository.findByUserId(userId).stream()
                .map(uss -> mapper.toResponseDTO(uss.getFlashcardSet()))
                .toList();
    }

    public FlashcardSetResponseDTO updatePrivacy(UUID id, boolean isPublic, UUID requesterId) throws AccessDeniedException {
        FlashcardSet entity = flashcardSetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("FlashcardSet", "id", id));
        if (!entity.getOwnerId().equals(requesterId)) {
            throw new AccessDeniedException("Not the owner of this set");
        }
        entity.setPublic(isPublic);
        flashcardSetRepository.save(entity);
        FlashcardSetResponseDTO dto = mapper.toResponseDTO(entity);
        dto.setIsOwner(true);
        dto.setIsSaved(false);
        return dto;
    }
}
