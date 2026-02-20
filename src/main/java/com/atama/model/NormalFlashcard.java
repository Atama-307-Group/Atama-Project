package com.atama.model;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@DiscriminatorValue("NORMAL")
@Getter
@Setter
@NoArgsConstructor
public class NormalFlashcard extends Flashcard {

    private String term;
    private String definition;

    public NormalFlashcard(String term, String definition) {
        this.term = term;
        this.definition = definition;
    }
}
