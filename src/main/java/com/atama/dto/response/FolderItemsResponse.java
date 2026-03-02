package com.atama.dto.response;

import com.atama.model.LibraryItemType;

import java.time.Instant;
import java.util.List;

public record FolderItemsResponse(
        Long folderId,
        String folderName,
        List<LibraryItemSummary> items
) {
    public record LibraryItemSummary(
            Long id,
            String title,
            boolean starred,
            Instant createdAt,
            Instant updatedAt,
            Instant lastAccessed,
            LibraryItemType item_type
    ) {}
}