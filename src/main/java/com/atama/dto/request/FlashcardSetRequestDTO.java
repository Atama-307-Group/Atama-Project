package com.atama.dto.request;


import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class FlashcardSetRequestDTO {
    private Long id; // id and title are both in library item
    private String title;
    private String description;
    private List<FlashcardRequestDTO> flashcards;
}
