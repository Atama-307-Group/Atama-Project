package com.atama.dto.request;

import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DragDropFlashcardRequestDTO extends FlashcardRequestDTO {
    // TODO: is id needed here?
    private String prompt;
    private String imageUrl;
    private List<String> draggableLabels;
    private List<DropZoneDTO> dropZones;
}
