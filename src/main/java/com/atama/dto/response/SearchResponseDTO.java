package com.atama.dto.response;

import java.util.List;

public record SearchResponseDTO(
        List<FolderResponse> folders,
        List<LibraryItemResponseDTO> flashcardSets,
        List<LibraryItemResponseDTO> pdfs
) {}