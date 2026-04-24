package com.atama.dto.response;

import java.util.UUID;

public record UserSearchDTO(
        UUID id,
        String username,
        String profilePictureUrl
) {}