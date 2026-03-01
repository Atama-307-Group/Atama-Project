package com.atama.dto.response;

import com.atama.dto.request.DropZoneDTO;
import com.atama.model.DropZone;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter

public class DragDropFlashcardResponseDTO extends FlashcardResponseDTO {
    private String prompt;
    private String imageUrl;
    private List<String> draggableLabels;
    // TODO: should this be DropZone DTO? bc otherwise DTO does not get used
    private List<DropZoneDTO> dropZones;
    //private FlashcardType type;
}
