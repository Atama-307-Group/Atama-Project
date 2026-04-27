package com.atama.dto.request;

import com.atama.model.ReportType;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class CreateReportDTO {
    private ReportType type;
    private String description;
    private UUID reportedUserId;
    private UUID reportedLibraryItemId;
}