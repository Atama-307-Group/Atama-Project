package com.atama.dto.response;

import com.atama.model.FlashcardType;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class FillBlankFlashcardResponseDTO extends FlashcardResponseDTO {
    private String textWithBlanks;
    private List<String> correctAnswers;
    private FlashcardType type;
}
