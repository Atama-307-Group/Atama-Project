package com.atama.service;

import com.atama.dto.response.FlashcardSetSearchDTO;
import com.atama.dto.response.FolderResponse;
import com.atama.dto.response.LibraryItemResponseDTO;
import com.atama.dto.response.SearchResponseDTO;
import com.atama.model.LibraryItemType;
import com.atama.repository.FolderRepository;
import com.atama.repository.LibraryItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SearchService {

    private final FolderRepository folderRepository;
    private final LibraryItemRepository libraryItemRepository;
    private final FlashcardSetReviewService reviewService;

    @Transactional(readOnly = true)
    public SearchResponseDTO search(String q, UUID userId) {
        List<FolderResponse> folders = folderRepository.searchFolders(q, userId)
                .stream()
                .map(f -> new FolderResponse(
                        f.getId(),
                        f.getName(),
                        f.isStarred(),
                        f.isPublic(),
                        f.getCreatedAt(),
                        f.getLastAccessed(),
                        f.getItems(),
                        f.getLibrary().getId()
                ))
                .toList();

        List<FlashcardSetSearchDTO> flashcardSets = libraryItemRepository
                .searchByType(q, LibraryItemType.FLASHCARD_SET, userId)
                .stream()
                .map(i -> {
                    FlashcardSetReviewService.ReviewAggregate agg = reviewService.getAggregate(i.getId());
                    return new FlashcardSetSearchDTO(
                            i.getId(), i.getTitle(), i.getCreatedAt(), i.getUpdatedAt(),
                            i.getLastAccessed(), i.isStarred(), i.getItemType(), i.isPublic(),
                            i.getFolder() != null ? i.getFolder().getId() : null,
                            agg.averageStars(), agg.topTags()
                    );
                })
                .toList();

        List<LibraryItemResponseDTO> pdfs = libraryItemRepository
                .searchByType(q, LibraryItemType.PDF, userId)
                .stream()
                .map(i -> new LibraryItemResponseDTO(
                        i.getId(), i.getTitle(), i.getCreatedAt(), i.getUpdatedAt(),
                        i.getLastAccessed(), i.isStarred(), i.getItemType(), i.isPublic(),
                        i.getFolder() != null ? i.getFolder().getId() : null
                ))
                .toList();

        return new SearchResponseDTO(folders, flashcardSets, pdfs);
    }
}
