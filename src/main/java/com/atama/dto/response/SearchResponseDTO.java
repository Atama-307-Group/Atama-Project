package com.atama.dto.response;

import lombok.AllArgsConstructor;

import java.util.List;

public record SearchResponseDTO(
        List<FolderResponse> folders,
        List<FlashcardSetSearchDTO> flashcardSets,
        List<LibraryItemResponseDTO> pdfs
) {}