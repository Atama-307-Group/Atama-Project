package com.atama.dto.request;

import lombok.Getter;
import lombok.Setter;
import java.util.UUID;
@Getter
@Setter

public class LibraryItemRequestDTO {
    private String title;
    private UUID folderID;
    @com.fasterxml.jackson.annotation.JsonProperty("isPublic")
    private boolean isPublic = true;
}
