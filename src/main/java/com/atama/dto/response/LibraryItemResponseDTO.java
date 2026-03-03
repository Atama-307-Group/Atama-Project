package com.atama.dto.response;

import com.atama.model.LibraryItemType;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
public class LibraryItemResponseDTO {
    private Long id;
    private String title;
    private Instant createdAt;
    private Instant updatedAt;
    private Instant lastAccessed;
    private boolean starred;
    private LibraryItemType itemType;
    private Long folderId; // just the ID to avoid deep nesting
}
