package com.atama.dto.response;

import com.atama.model.CourseRequest;

import java.time.Instant;
import java.util.UUID;

public record CourseRequestResponseDTO(
        UUID id,
        String code,
        String name,
        String status,
        Instant createdAt,
        String requesterUsername,
        String universityName
) {
    public static CourseRequestResponseDTO from(CourseRequest r) {
        return new CourseRequestResponseDTO(
                r.getId(),
                r.getCode(),
                r.getName(),
                r.getStatus().name(),
                r.getCreatedAt(),
                r.getUser() != null ? r.getUser().getUsername() : null,
                r.getUniversity() != null ? r.getUniversity().getName() : null
        );
    }
}
