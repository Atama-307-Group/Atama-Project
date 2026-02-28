package com.atama.mapper;
import com.atama.dto.request.*;
import com.atama.dto.request.FlashcardSetRequestDTO;
import com.atama.dto.response.FlashcardSetResponseDTO;
import com.atama.model.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
//import jakarta.validation.Valid;

@Component
@RequiredArgsConstructor
public class FlashcardSetMapper {

    private final FlashcardMapper flashcardMapper;
    private final LibraryItemMapper libraryItemMapper;

    public FlashcardSet toEntity(FlashcardSetRequestDTO dto) {
        FlashcardSet entity = new FlashcardSet();
        libraryItemMapper.applyRequestDTO(dto, entity); // handles title, etc.
        entity.setDescription(dto.getDescription());
        entity.setOwnerId(dto.getOwnerId());
        dto.getFlashcards().stream()
                .map(flashcardMapper::toEntity)
                .forEach(entity::addFlashcard); // use addFlashcard to maintain bidirectional link
        return entity;
    }

    public FlashcardSetResponseDTO toResponseDTO(FlashcardSet entity) {
        FlashcardSetResponseDTO dto = new FlashcardSetResponseDTO();
        libraryItemMapper.toResponseDTO(entity, dto); // handles id, title, timestamps, etc.
        dto.setDescription(entity.getDescription());
        dto.setOwnerId(entity.getOwnerId());
        dto.setFlashcards(
                entity.getFlashcards().stream()
                        .map(flashcardMapper::toResponseDTO)
                        .toList()
        );
        return dto;
    }
}