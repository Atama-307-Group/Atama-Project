package com.atama.service;

import com.atama.exception.ResourceNotFoundException;
import com.atama.model.Folder;
import com.atama.model.Library;
import com.atama.model.LibraryItem;
import com.atama.model.LibrarySortType;
import com.atama.repository.LibraryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional
public class LibraryService {

    private final LibraryRepository libraryRepository;

    public Library createLibrary(Library library) {
        return libraryRepository.save(library);
    }

    /*
    Function to retrieve a Library based off of its ID.
     */
    @Transactional(readOnly = true)
    public Library getLibraryById(Long id) {
        return libraryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Library", "id", id));
    }

    /*
    Function to retrieve a Library based off of its User's ID.
    */
    @Transactional(readOnly = true)
    public Library getLibraryByUserId(Long userId) {
        return libraryRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Library", "userId", userId));
    }

    /*
    Function to compare objects within a Library, for sorting purposes.
     */
    private Comparator<Object> buildComparator(LibrarySortType sortType) {

        // Optional: starred-first (requires boolean isStarred() on Folder and LibraryItem)
        Comparator<Object> starredFirst = Comparator.comparing(
                (Object obj) -> !isStarred(obj) // starred => false => sorts first
        );

        Comparator<Object> baseComparator = switch (sortType) {

            case ALPHABETICAL -> Comparator.comparing(obj -> {
                if (obj instanceof Folder folder) return folder.getName().toLowerCase(Locale.ROOT);
                if (obj instanceof LibraryItem item) return item.getTitle().toLowerCase(Locale.ROOT);
                return "";
            });

            case CREATED_AT -> Comparator.comparing(
                    obj -> {
                        if (obj instanceof Folder folder) return folder.getCreatedAt();
                        if (obj instanceof LibraryItem item) return item.getCreatedAt();
                        return null;
                    },
                    Comparator.nullsLast(Comparator.naturalOrder())
            );

            case LAST_ACCESSED -> Comparator.comparing(
                    obj -> {
                        if (obj instanceof Folder folder) return folder.getLastAccessed();
                        if (obj instanceof LibraryItem item) return item.getUpdatedAt(); // swap to getLastAccessed() later
                        return null;
                    },
                    Comparator.nullsLast(Comparator.naturalOrder())
            );
        };

        Comparator<Object> folderFirstOnTie = Comparator.comparing(obj -> !(obj instanceof Folder));

        return starredFirst
                .thenComparing(baseComparator)
                .thenComparing(folderFirstOnTie);
    }

    private boolean isStarred(Object obj) {
        if (obj instanceof Folder folder) return folder.isStarred();
        if (obj instanceof LibraryItem item) return item.isStarred();
        return false;
    }

    /*
    Function
     */
    public List<Object> getSortedLibraryContents(Long userId, LibrarySortType sortType) {

        Library library = getLibraryByUserId(userId);   // Obtain Library

        List<Object> combined = new ArrayList<>();  // List to hold combined objects

        // add folders
        combined.addAll(library.getFolders());

        // add loose items (items with folder == null)
        library.getItems().stream()
                .filter(item -> item.getFolder() == null)
                .forEach(combined::add);

        Comparator<Object> comparator = buildComparator(sortType);

        combined.sort(comparator);

        return combined;
    }

    /*
    Function to toggle a library's privacy.
     */
    @Transactional
    public void setLibraryPrivacy(Long userId, boolean makePrivate) {

        // Look for the User's Library
        Library library = libraryRepository.findByUserId(userId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Library", "userId", userId)
                );

        library.setPrivate(makePrivate);    // Toggle the privacy
    }
}
