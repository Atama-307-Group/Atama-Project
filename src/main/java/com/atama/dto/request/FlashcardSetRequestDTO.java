package com.atama.dto.request;


import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class FlashcardSetRequestDTO extends LibraryItemRequestDTO {
    private String description;
    private Long ownerId;
    private List<FlashcardRequestDTO> flashcards = new ArrayList<>();
}
