package com.atama.dto.response;

import java.util.UUID;

public record CourseLibraryItemResponseDTO(
        UUID id,
        String year,
        String semester,
        String description,
        LibraryItemResponseDTO libraryItem
) {}