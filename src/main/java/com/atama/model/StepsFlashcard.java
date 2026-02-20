package com.atama.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Entity
@DiscriminatorValue("STEPS")
@Getter
@Setter
@NoArgsConstructor
public class StepsFlashcard extends Flashcard {

    private String title;

    @ElementCollection
    @CollectionTable(name = "steps_flashcard_steps", joinColumns = @JoinColumn(name = "flashcard_id"))
    @Column(name = "step")
    private List<String> steps;

    public StepsFlashcard(String title, List<String> steps) {
        this.title = title;
        this.steps = steps;
    }
}
