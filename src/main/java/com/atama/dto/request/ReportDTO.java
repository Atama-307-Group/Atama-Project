package com.atama.dto.request;

import com.atama.model.Report;

import java.time.Instant;
import java.util.UUID;

public record ReportDTO(
        UUID id,
        String type,
        String description,
        String status,
        Instant createdAt,
        String reporterUsername,
        String reportedUsername,       // null if reporting a library item
        String reportedItemTitle       // null if reporting a user
) {
    public static ReportDTO from(Report r) {
        return new ReportDTO(
                r.getId(),
                r.getType().name(),
                r.getDescription(),
                r.getStatus().name(),
                r.getCreatedAt(),
                r.getUser() != null ? r.getUser().getUsername() : null,
                r.getReportedUser() != null ? r.getReportedUser().getUsername() : null,
                r.getReportedLibraryItem() != null ? r.getReportedLibraryItem().getTitle() : null
        );
    }
}