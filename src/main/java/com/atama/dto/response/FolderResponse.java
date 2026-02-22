package com.atama.dto.response;

public record FolderResponse(
        Long id,
        String name,
        java.time.Instant createdAt,
        java.time.Instant lastAccessed,
        Long libraryId
) {}