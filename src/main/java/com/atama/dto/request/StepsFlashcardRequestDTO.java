package com.atama.dto.request;

import lombok.Getter;
import lombok.Setter;
import java.util.List;

@Getter
@Setter
public class StepsFlashcardRequestDTO extends FlashcardRequestDTO {
    private String title;
    private List<String> steps;
}