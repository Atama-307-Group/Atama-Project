package com.atama.dto.response;

import com.atama.model.FlashcardType;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class NormalFlashcardResponseDTO extends FlashcardResponseDTO {
    private String term;
    private String definition;
    //private FlashcardType type;
}
