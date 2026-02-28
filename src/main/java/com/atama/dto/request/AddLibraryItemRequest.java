package com.atama.dto.request;

public record AddLibraryItemRequest(
        String name,
        Enum contentType, // this enum should be defined in model,
        Long id
) {}