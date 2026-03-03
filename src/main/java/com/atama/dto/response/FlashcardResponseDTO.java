package com.atama.dto.response;

import com.atama.model.FlashcardType;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import lombok.Getter;
import lombok.Setter;

@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "type")
@JsonSubTypes({
        @JsonSubTypes.Type(value = NormalFlashcardResponseDTO.class, name = "NORMAL"),
        @JsonSubTypes.Type(value = DragDropFlashcardResponseDTO.class, name = "DRAG_DROP"),
        @JsonSubTypes.Type(value = FillBlankFlashcardResponseDTO.class, name = "FILL_BLANK"),
        @JsonSubTypes.Type(value = StepsFlashcardResponseDTO.class, name = "STEPS")
})
@Getter
@Setter
public class FlashcardResponseDTO {
    private Long id;
    private FlashcardType type;
}