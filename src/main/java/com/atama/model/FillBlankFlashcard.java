package com.atama.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Entity
@DiscriminatorValue("FILL_BLANK")
@Getter
@Setter
@NoArgsConstructor
public class FillBlankFlashcard extends Flashcard {

    private String textWithBlanks;

    @ElementCollection
    @CollectionTable(name = "fill_blank_correct_answers", joinColumns = @JoinColumn(name = "flashcard_id"))
    @Column(name = "answer")
    private List<String> correctAnswers;

    public FillBlankFlashcard(String textWithBlanks, List<String> correctAnswers) {
        this.textWithBlanks = textWithBlanks;
        this.correctAnswers = correctAnswers;
    }
}
