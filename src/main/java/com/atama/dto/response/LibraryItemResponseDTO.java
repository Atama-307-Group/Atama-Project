package com.atama.dto.response;

import com.atama.model.LibraryItemType;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class LibraryItemResponseDTO {
    private UUID id;
    private String title;
    private Instant createdAt;
    private Instant updatedAt;
    private Instant lastAccessed;
    private boolean starred;
    private LibraryItemType itemType;
    private boolean isPublic = true;
    private UUID folderId; // just the ID to avoid deep nesting
}
