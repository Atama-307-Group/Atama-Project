package com.atama.dto.request;

// TODO figure out
public record AddLibraryItemRequest(
        String name,
        Enum contentType,
        Long id
) {}