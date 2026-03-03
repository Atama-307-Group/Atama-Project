package com.atama.model;

import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DropZone {
    private Long id;
    /** X position on the image (percentage, 0–100) */
    private double x;

    /** Y position on the image (percentage, 0–100) */
    private double y;

    /** The correct label that should be dragged here */
    private String correctLabel;

    public double getX() {
        return x;
    }

}
