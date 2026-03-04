package com.atama.dto.request;


import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
@Getter
@Setter
public class FlashcardSetRequestDTO extends LibraryItemRequestDTO {
    private String description;
    private String university;
    private String course;
    private UUID ownerId;
    private List<FlashcardRequestDTO> flashcards = new ArrayList<>();
}
