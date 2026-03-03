package com.atama.dto.request;
import lombok.Getter;
import lombok.Setter;
import java.util.List;

@Getter
@Setter
public class FillBlankFlashcardRequestDTO extends FlashcardRequestDTO {
    private String textWithBlanks;
    private List<String> correctAnswers;
}