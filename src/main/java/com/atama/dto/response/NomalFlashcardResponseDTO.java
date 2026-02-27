package com.atama.dto.response;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class NomalFlashcardResponseDTO extends FlashcardResponseDTO{
    private String term;
    private String definition;
}
