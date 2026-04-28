package com.atama.dto.response;

import com.atama.model.ReviewTag;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
public class FlashcardSetSearchDTO extends LibraryItemResponseDTO {
    private Double averageRating;
    private List<ReviewTag> topTags;

    public FlashcardSetSearchDTO(UUID id, String title, Instant createdAt, Instant updatedAt,
                                 Instant lastAccessed, boolean starred,
                                 com.atama.model.LibraryItemType itemType, boolean isPublic,
                                 UUID folderId, UUID ownerId, Double averageRating, List<ReviewTag> topTags) {
        super(id, title, createdAt, updatedAt, lastAccessed, starred, itemType, isPublic, folderId, ownerId);
        this.averageRating = averageRating;
        this.topTags = topTags;
    }
}