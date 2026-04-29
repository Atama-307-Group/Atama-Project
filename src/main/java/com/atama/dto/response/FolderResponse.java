package com.atama.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
public record FolderResponse(
        UUID id,
        String name,
        boolean starred,
        @JsonProperty("isPublic") boolean isPublic,
        Instant createdAt,
        Instant lastAccessed,
        List<LibraryItemResponseDTO> items,
        UUID libraryId
) {}