package com.atama.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class NormalFlashcardRequestDTO extends FlashcardRequestDTO{
    private String term;
    private String definition;
}
