package com.atama.model;

public enum ReviewTag {
    // Positive
    WELL_ORGANIZED(true),
    COVERS_EXAM_CONTENT(true),
    EASY_TO_STUDY(true),
    COVERS_LECTURE_CONTENT(true),

    // Negative
    OUTDATED(false),
    NOT_ENOUGH_CONTENT(false),
    POORLY_ORGANIZED(false),
    TOO_SIMPLE(false),
    TOO_COMPLEX(false);

    private final boolean positive;

    ReviewTag(boolean positive) {
        this.positive = positive;
    }

    public boolean isPositive() {
        return positive;
    }
}