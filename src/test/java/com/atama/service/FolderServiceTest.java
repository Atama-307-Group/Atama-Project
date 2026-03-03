package com.atama.service;

import com.atama.model.Folder;
import com.atama.model.Library;
import com.atama.repository.FolderRepository;
import com.atama.repository.LibraryRepository;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;


@SpringBootTest
@Transactional
class FolderServiceTest {

    @Autowired
    private FolderService folderService;

    @Autowired
    private FolderRepository folderRepository;

    @Autowired
    private LibraryRepository libraryRepository;

    @Test
    void shouldRenameFolderSuccessfully() {
        Library library = new Library();
        library = libraryRepository.save(library);

        Folder folder = new Folder();
        folder.setName("Old Name");
        folder.setLibrary(library);
        folder = folderRepository.save(folder);

        Folder renamed = folderService.renameFolder(folder.getId(), "New Name");

        Assertions.assertEquals("New Name", renamed.getName());
    }

    @Test
    void shouldThrowIfFolderNotFound() {
        Assertions.assertThrows(RuntimeException.class, () ->
                folderService.renameFolder(999L, "Anything")
        );
    }

    @Test
    void shouldThrowIfNameIsBlank() {
        Library library = new Library();
        library = libraryRepository.save(library);

        Folder folder = new Folder();
        folder.setName("Original");
        folder.setLibrary(library);
        folder = folderRepository.save(folder);

        Folder finalFolder = folder;
        Assertions.assertThrows(IllegalArgumentException.class, () ->
                folderService.renameFolder(finalFolder.getId(), "")
        );
    }
}