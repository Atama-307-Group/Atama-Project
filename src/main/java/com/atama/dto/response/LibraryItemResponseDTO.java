package com.atama.dto.response;

import com.atama.model.LibraryItem;
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
    private UUID folderId; // just the ID to avoid deep nesting

    public static LibraryItemResponseDTO fromEntity(LibraryItem item) {
        LibraryItemResponseDTO dto = new LibraryItemResponseDTO();
        dto.setId(item.getId());
        dto.setTitle(item.getTitle());
        dto.setItemType(item.getItemType());
        dto.setCreatedAt(item.getCreatedAt());
        dto.setUpdatedAt(item.getUpdatedAt());
        dto.setLastAccessed(item.getLastAccessed());
        dto.setStarred(item.isStarred());
        dto.setFolderId(item.getFolder() != null ? item.getFolder().getId() : null);
        return dto;
    }
}


