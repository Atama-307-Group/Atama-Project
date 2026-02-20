package com.atama.model;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

public class DragDropFlashcard implements Flashcard {
    private int id;
    @Setter
    @Getter
    private String prompt;
    @Setter
    @Getter
    private List<String> draggableItems;
    @Setter
    @Getter
    private List<String> dropTargets;

    public DragDropFlashcard() {}

    public DragDropFlashcard(int id, String prompt, List<String> draggableItems, List<String> dropTargets) {
        this.id = id;
        this.prompt = prompt;
        this.draggableItems = draggableItems;
        this.dropTargets = dropTargets;
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
