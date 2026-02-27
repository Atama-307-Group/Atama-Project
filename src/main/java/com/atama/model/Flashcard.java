package com.atama.model;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@JsonTypeInfo(
        use = JsonTypeInfo.Id.NAME,
        include = JsonTypeInfo.As.PROPERTY,
        property = "type"
)
@JsonSubTypes({
        @JsonSubTypes.Type(value = NormalFlashcard.class, name = "NORMAL"),
        @JsonSubTypes.Type(value = DragDropFlashcard.class, name = "DRAG_DROP"),
        @JsonSubTypes.Type(value = FillBlankFlashcard.class, name = "FILL_BLANK"),
        @JsonSubTypes.Type(value = StepsFlashcard.class, name = "STEPS")
})

@Entity
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
@DiscriminatorColumn(name = "type")
@Getter
@Setter
public abstract class Flashcard {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY) // idk about this
    @JoinColumn(name = "flashcard_set_id")
    private FlashcardSet flashcardSet;
}
