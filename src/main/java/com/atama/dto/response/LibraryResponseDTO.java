package com.atama.dto.response;

import java.util.List;
import java.util.UUID;

public record LibraryResponseDTO(
        UUID id,
        List<FolderResponse> folders,
        List<LibraryItemResponseDTO> looseItems
) {}