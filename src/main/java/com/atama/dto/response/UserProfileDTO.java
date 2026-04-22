package com.atama.dto.response;

import java.util.List;
import java.util.UUID;

public record UserProfileDTO(
        UUID id,
        String username,
        String profilePictureUrl,
        List<FlashcardSetSearchDTO> publicSets
) {}