package com.atama.dto.response;

import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
public class ConceptMapResponseDTO {
    private UUID id;
    private String title;
    private String graphData;
    private String pngPath;
    private UUID sourceSetId;
    private Instant createdAt;
}
