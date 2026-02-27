package com.atama.dto.request;

public record AddLibraryItemRequest(
        String name,
        Enum contentType,
        Long id
) {}