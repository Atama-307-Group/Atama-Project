package com.atama.dto.response;

import com.atama.dto.request.DropZoneDTO;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter

public class DragDropFlashcardResponseDTO extends FlashcardResponseDTO {
    private String prompt;
    private String imageUrl;
    private List<String> draggableLabels;
    private List<DropZoneDTO> dropZones;
}
