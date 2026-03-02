package com.atama.dto.response;

import java.time.Instant;
import java.util.List;

public record FolderResponse(
        Long id,
        String name,
        boolean starred,
        Instant createdAt,
        Instant lastAccessed,
        List<com.atama.model.LibraryItem> itemIds,
        Long libraryId
) {}