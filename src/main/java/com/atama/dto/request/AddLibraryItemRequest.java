package com.atama.dto.request;

import java.util.UUID;

// TODO figure out
public record AddLibraryItemRequest(
        String name,
        Enum contentType, // this enum should be defined in model,
        UUID id
) {}