package com.atama.model;

import java.time.Instant;
import java.util.UUID;

public interface LibraryItem {
    UUID id();
    UUID ownerId();     // ID of the user of the library
    String title();
    LibraryItemType type();
    Instant createdAt();
    Instant updatedAt();

    UUID getId();
    String getTitle();
    void open(); // Logic for how the item is viewed
}

enum LibraryItemType {
    FLASHCARD_SET,
    PRACTICE_TEST,
    STUDY_GUIDE,
    DOCUMENT
}