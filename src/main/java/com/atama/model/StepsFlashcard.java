package com.atama.model;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

public class StepsFlashcard implements Flashcard {
    private int id;
    @Setter
    @Getter
    private String title;
    @Setter
    @Getter
    private List<String> steps;

    public StepsFlashcard() {}

    public StepsFlashcard(int id, String title, List<String> steps) {
        this.id = id;
        this.title = title;
        this.steps = steps;
    }

    @Override
    public int getId() {
        return id;
    }

    @Override
    public void setId(int id) {
        this.id = id;
    }

}
