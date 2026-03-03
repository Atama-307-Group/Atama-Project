package com.atama.mapper;

import com.atama.model.LibraryItem;
import org.springframework.stereotype.Component;
import com.atama.dto.request.*;
import com.atama.dto.response.*;

@Component
public class LibraryItemMapper {

    public void applyRequestDTO(LibraryItemRequestDTO dto, LibraryItem entity) {
        entity.setTitle(dto.getTitle());
        // folder and library are typically resolved via service layer, not set here
    }

    public void toResponseDTO(LibraryItem entity, LibraryItemResponseDTO dto) {
        dto.setId(entity.getId());
        dto.setTitle(entity.getTitle());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        dto.setLastAccessed(entity.getLastAccessed());
        dto.setStarred(entity.isStarred());
        dto.setItemType(entity.getItem_type());
        if (entity.getFolder() != null) {
            dto.setFolderId(entity.getFolder().getId());
        }
    }
}