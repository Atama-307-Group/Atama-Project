package com.atama.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.Instant;
import java.util.List;

public record FolderResponse(
        Long id,
        String name,
        boolean starred,
        @JsonProperty("isPublic") boolean isPublic,
        Instant createdAt,
        Instant lastAccessed,
        List<com.atama.model.LibraryItem> items,
        Long libraryId
) {}