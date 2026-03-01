package com.atama.mapper;
import com.atama.dto.request.*;
import com.atama.dto.response.*;
import com.atama.model.*;
import org.springframework.stereotype.Component;

@Component
public class FlashcardMapper {

    public Flashcard toEntity(FlashcardRequestDTO dto) {
        if (dto instanceof DragDropFlashcardRequestDTO d) return toEntity(d);
        if (dto instanceof StepsFlashcardRequestDTO s) return toEntity(s);
        if (dto instanceof FillBlankFlashcardRequestDTO f) return toEntity(f);
        if (dto instanceof NormalFlashcardRequestDTO b) return toEntity(b);
        throw new IllegalArgumentException("Unknown flashcard type");
    }

    public FlashcardResponseDTO toResponseDTO(Flashcard card) {
        if (card instanceof DragDropFlashcard d) return toResponseDTO(d);
        if (card instanceof StepsFlashcard s) return toResponseDTO(s);
        if (card instanceof FillBlankFlashcard f) return toResponseDTO(f);
        if (card instanceof NormalFlashcard b) return toResponseDTO(b);
        throw new IllegalArgumentException("Unknown flashcard type");
    }

    private NormalFlashcard toEntity(NormalFlashcardRequestDTO dto) {
        NormalFlashcard card = new NormalFlashcard();
        card.setTerm(dto.getTerm());
        card.setDefinition(dto.getDefinition());
        return card;
    }


    private DragDropFlashcard toEntity(DragDropFlashcardRequestDTO dto) {
        DragDropFlashcard card = new DragDropFlashcard();
        card.setPrompt(dto.getPrompt());
        card.setImageUrl(dto.getImageUrl());
        card.setDraggableLabels(dto.getDraggableLabels());
        card.setDropZones(
                dto.getDropZones().stream().map(this::toEntity).toList()
        );
        return card;
    }

    private StepsFlashcard toEntity(StepsFlashcardRequestDTO dto) {
        StepsFlashcard card = new StepsFlashcard();
        card.setTitle(dto.getTitle());
        card.setSteps(dto.getSteps());
        return card;
    }

    private FillBlankFlashcard toEntity(FillBlankFlashcardRequestDTO dto) {
        FillBlankFlashcard card = new FillBlankFlashcard();
        card.setTextWithBlanks(dto.getTextWithBlanks());
        card.setCorrectAnswers(dto.getCorrectAnswers());
        return card;
    }

    private DropZone toEntity(DropZoneDTO dto) {
        DropZone z = new DropZone();
        z.setId(dto.getId());
        z.setX(dto.getX());
        z.setY(dto.getY());
        //z.setCorrectLabel(dto.getCorrectLabel());
        return z;
    }

    private NormalFlashcardResponseDTO toResponseDTO(NormalFlashcard card) {
        NormalFlashcardResponseDTO dto = new NormalFlashcardResponseDTO();
        dto.setId(card.getId());
        dto.setType(resolveType(card));
        dto.setTerm(card.getTerm());
        dto.setDefinition(card.getDefinition());
        return dto;
    }

    private DragDropFlashcardResponseDTO toResponseDTO(DragDropFlashcard card) {
        DragDropFlashcardResponseDTO dto = new DragDropFlashcardResponseDTO();
        dto.setId(card.getId());
        dto.setType(resolveType(card));
        dto.setPrompt(card.getPrompt());
        dto.setImageUrl(card.getImageUrl());
        dto.setDraggableLabels(card.getDraggableLabels());
        //dto.setDropZones(card.getDropZones());
        dto.setDropZones(card.getDropZones().stream().map(this::toDropZoneDTO).toList());
        return dto;
    }

    private StepsFlashcardResponseDTO toResponseDTO(StepsFlashcard card) {
        StepsFlashcardResponseDTO dto = new StepsFlashcardResponseDTO();
        dto.setId(card.getId());
        dto.setType(resolveType(card));
        dto.setTitle(card.getTitle());
        dto.setSteps(card.getSteps());
        return dto;
    }

    private FillBlankFlashcardResponseDTO toResponseDTO(FillBlankFlashcard card) {
        FillBlankFlashcardResponseDTO dto = new FillBlankFlashcardResponseDTO();
        dto.setId(card.getId());
        dto.setType(resolveType(card));
        dto.setTextWithBlanks(card.getTextWithBlanks());
        dto.setCorrectAnswers(card.getCorrectAnswers());
        return dto;
    }

    private DropZoneDTO toDropZoneDTO(DropZone zone) {
        DropZoneDTO dto = new DropZoneDTO();
        dto.setId(zone.getId());
        dto.setX(zone.getX());
        dto.setY(zone.getY());
        return dto;
    }

    private FlashcardType resolveType(Flashcard card) {
        if (card instanceof DragDropFlashcard) return FlashcardType.DRAG_DROP;
        if (card instanceof StepsFlashcard) return FlashcardType.STEPS;
        if (card instanceof FillBlankFlashcard) return FlashcardType.FILL_BLANK;
        if (card instanceof NormalFlashcard) return FlashcardType.NORMAL;

        throw new IllegalStateException("Unknown Flashcard subclass: " + card.getClass());
    }
}
