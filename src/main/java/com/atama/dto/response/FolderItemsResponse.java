package com.atama.dto.response;

import com.atama.model.LibraryItemType;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
public record FolderItemsResponse(
        UUID folderId,
        String folderName,
        List<LibraryItemSummary> items
) {
    public record LibraryItemSummary(
            UUID id,
            String title,
            boolean starred,
            Instant createdAt,
            Instant updatedAt,
            Instant lastAccessed,
            LibraryItemType item_type
    ) {}
}