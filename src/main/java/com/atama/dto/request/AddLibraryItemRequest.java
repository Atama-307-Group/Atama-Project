package com.atama.dto.request;

// TODO figure out
public record AddLibraryItemRequest(
        String name,
        Enum contentType, // this enum should be defined in model,
        Long id
) {}