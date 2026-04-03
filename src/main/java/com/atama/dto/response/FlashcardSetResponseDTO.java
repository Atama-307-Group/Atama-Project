package com.atama.dto.response;


import com.atama.dto.request.DragDropFlashcardRequestDTO;
import com.atama.dto.request.FillBlankFlashcardRequestDTO;
import com.atama.dto.request.NormalFlashcardRequestDTO;
import com.atama.dto.request.StepsFlashcardRequestDTO;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
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
public class FlashcardSetResponseDTO extends LibraryItemResponseDTO {
    private String description;
    private String university;
    private String course;
    private UUID ownerId;
    private List<FlashcardResponseDTO> flashcards = new ArrayList<>();
    private Boolean isOwner;
    private Boolean isSaved;
    private Boolean isPublic;
}
