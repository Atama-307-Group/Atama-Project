package com.atama.dto.response;

import com.atama.model.FlashcardType;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class StepsFlashcardResponseDTO extends FlashcardResponseDTO {
    private String title;
    private List<String> steps;
    private FlashcardType type;
}
