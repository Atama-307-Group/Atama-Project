package com.atama.dto.request;

import com.atama.model.CourseRequest;

import java.time.Instant;
import java.util.UUID;

public record CourseRequestDTO(
        UUID id,
        String code,
        String name,
        String status,
        Instant createdAt,
        String requesterUsername,
        String universityName
) {
    public static CourseRequestDTO from(CourseRequest r) {
        return new CourseRequestDTO(
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
