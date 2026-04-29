package com.atama.service;

import com.atama.dto.response.*;
import com.atama.model.LibraryItemType;
import com.atama.repository.FolderRepository;
import com.atama.repository.LibraryItemRepository;
import com.atama.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
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
    private final UserRepository userRepository;

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
                        f.getItems().stream()
                                .map(i -> new LibraryItemResponseDTO(
                                        i.getId(),
                                        i.getTitle(),
                                        i.getCreatedAt(),
                                        i.getUpdatedAt(),
                                        i.getLastAccessed(),
                                        i.isStarred(),
                                        i.getItemType(),
                                        i.isPublic(),
                                        f.getId(),
                                        i.getOwner().getId()
                                ))
                                .toList(),
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
                            i.getOwner() != null ? i.getOwner().getId() : null,
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
                        i.getFolder() != null ? i.getFolder().getId() : null,
                        i.getOwner() != null ? i.getOwner().getId() : null
                ))
                .toList();

        List<LibraryItemResponseDTO> conceptMaps = libraryItemRepository
                .searchByType(q, LibraryItemType.CONCEPT_MAP, userId)
                .stream()
                .map(i -> new LibraryItemResponseDTO(
                        i.getId(), i.getTitle(), i.getCreatedAt(), i.getUpdatedAt(),
                        i.getLastAccessed(), i.isStarred(), i.getItemType(), i.isPublic(),
                        i.getFolder() != null ? i.getFolder().getId() : null,
                        i.getOwner() != null ? i.getOwner().getId() : null
                ))
                .toList();

        List<UserSearchDTO> users = userRepository
                .searchByUsername(q)
                .stream()
                .filter(u -> !u.getId().equals(userId))
                .map(u -> new UserSearchDTO(u.getId(), u.getUsername(), u.getProfilePictureUrl()))
                .toList();

        return new SearchResponseDTO(folders, flashcardSets, pdfs, conceptMaps, users);
    }
}
