package com.atama.dto.response;

import java.util.List;

public record SearchResponseDTO(
        List<FolderResponse> folders,
        List<FlashcardSetSearchDTO> flashcardSets,
        List<LibraryItemResponseDTO> pdfs,
        List<LibraryItemResponseDTO> conceptMaps,
        List<UserSearchDTO> users
) {}