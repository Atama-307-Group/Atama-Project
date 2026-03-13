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

    @Column(columnDefinition = "TEXT")
    private String imageUrl;

    @ElementCollection
    @CollectionTable(name = "drag_drop_zones", joinColumns = @JoinColumn(name = "flashcard_id"))
    private List<DropZone> dropZones;

    @ElementCollection
    @CollectionTable(name = "drag_drop_labels", joinColumns = @JoinColumn(name = "flashcard_id"))
    @Column(name = "label")
    private List<String> draggableLabels;

    public DragDropFlashcard(String prompt, String imageUrl, List<DropZone> dropZones, List<String> draggableLabels) {
        this.prompt = prompt;
        this.imageUrl = imageUrl;
        this.dropZones = dropZones;
        this.draggableLabels = draggableLabels;
    }
}


