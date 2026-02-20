package com.atama.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Entity
@DiscriminatorValue("DRAG_DROP")
@Getter
@Setter
@NoArgsConstructor
public class DragDropFlashcard extends Flashcard {

    private String prompt;

    @ElementCollection
    @CollectionTable(name = "drag_drop_draggable_items", joinColumns = @JoinColumn(name = "flashcard_id"))
    @Column(name = "item")
    private List<String> draggableItems;

    @ElementCollection
    @CollectionTable(name = "drag_drop_drop_targets", joinColumns = @JoinColumn(name = "flashcard_id"))
    @Column(name = "target")
    private List<String> dropTargets;

    public DragDropFlashcard(String prompt, List<String> draggableItems, List<String> dropTargets) {
        this.prompt = prompt;
        this.draggableItems = draggableItems;
        this.dropTargets = dropTargets;
    }
}
