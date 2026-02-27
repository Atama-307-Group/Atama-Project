package com.atama.dto.request;


import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;

@JsonTypeInfo(
        use = JsonTypeInfo.Id.NAME,
        include = JsonTypeInfo.As.PROPERTY,
        property = "type"
)
@JsonSubTypes({
        @JsonSubTypes.Type(value = NormalFlashcardRequestDTO.class, name = "NORMAL"),
        @JsonSubTypes.Type(value = DragDropFlashcardRequestDTO.class, name = "DRAG_DROP"),
        @JsonSubTypes.Type(value = StepsFlashcardRequestDTO.class, name = "STEPS"),
        @JsonSubTypes.Type(value = FillBlankFlashcardRequestDTO.class, name = "FILL_BLANK")
})
public class FlashcardRequestDTO {
    private Long id;

}
