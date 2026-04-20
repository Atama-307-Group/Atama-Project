package com.atama.service;

import com.atama.repository.*;
import com.atama.model.*;
import com.atama.dto.request.*;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LibraryItemService {

    private final LibraryRepository libraryRepository;
    private final FolderRepository folderRepository;
    private final LibraryItemRepository libraryItemRepository;
    private final PDFRepository pdfRepository;
    private final CourseRepository courseRepository;
    private final CourseLibraryItemRepository courseLibraryItemRepository;
    private final RecommendationService recommendationService;

//    public void initializeLibraryItem(LibraryItem item, LibraryItemRequestDTO dto) {
//        item.setTitle(dto.getTitle());
//
////        item.setItem_type(resolveItemType(item));
//    }

    public void initializeLibraryItem(LibraryItem item, LibraryItemRequestDTO dto, UUID userId) {
        // TODO need to fix so that the user UUID is sent
        //Library library = libraryRepository.findByUserId(UUID.fromString("85a98b1e-9ef8-4615-9d5c-66d3e5c391a1"))
        Library library = libraryRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Library not found"));

        item.setTitle(dto.getTitle());
        item.setLibrary(library);
        item.setItemType(resolveItemType(item));
        System.out.println("Found library: " + library.getId());
        System.out.println("Setting library on item: " + item.getClass().getSimpleName());


        if (dto.getFolderID() != null) {
            Folder folder = folderRepository.findById(dto.getFolderID())
                    .orElseThrow(() -> new RuntimeException("Folder not found"));

            // make sure folder belongs to this library
            if (!folder.getLibrary().getId().equals(library.getId())) {
                throw new RuntimeException("Folder does not belong to this library");
            }

            item.setFolder(folder);
        }
    }

    private LibraryItemType resolveItemType(LibraryItem item) {
        if (item instanceof FlashcardSet) return LibraryItemType.FLASHCARD_SET;
        if (item instanceof PDF) return LibraryItemType.PDF;
        throw new IllegalArgumentException("Unknown LibraryItem subtype: " + item.getClass());
    }

    public List<LibraryItem> getAllItems(UUID userId) {
        //Library library = libraryRepository.findByUserId(UUID.fromString("85a98b1e-9ef8-4615-9d5c-66d3e5c391a1"))
        Library library = libraryRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Library not found"));
        return libraryItemRepository.findAllByLibraryId(library.getId());
    }

    public LibraryItem moveToFolder(UUID itemId, UUID folderId) {
        LibraryItem item = libraryItemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Item not found"));
        Folder folder = folderRepository.findById(folderId)
                .orElseThrow(() -> new RuntimeException("Folder not found"));
        item.setFolder(folder);
        return libraryItemRepository.save(item);
    }

    public LibraryItem removeFromFolder(UUID itemId) {
        LibraryItem item = libraryItemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Item not found"));
        item.setFolder(null);
        return libraryItemRepository.save(item);
    }

    /*public LibraryItem uploadPDF(MultipartFile file, UUID userId) throws IOException {
        String uploadsDir = "uploads/";
        Files.createDirectories(Paths.get(uploadsDir));

        String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
        Path filePath = Paths.get(uploadsDir + fileName);
        Files.write(filePath, file.getBytes());

        PDF pdf = new PDF();
        pdf.setTitle(file.getOriginalFilename());
        pdf.setFilePath(filePath.toString());
        pdf.setItemType(LibraryItemType.PDF);

        //Library library = libraryRepository.findByUserId(UUID.fromString("85a98b1e-9ef8-4615-9d5c-66d3e5c391a1"))
        Library library = libraryRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Library not found"));
        pdf.setLibrary(library);

        return pdfRepository.save(pdf);
    }*/
    private PDF createPDF(MultipartFile file, String title, UUID userId) throws IOException {
        String uploadsDir = "uploads/";
        Files.createDirectories(Paths.get(uploadsDir));
        String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
        Path filePath = Paths.get(uploadsDir + fileName);
        Files.write(filePath, file.getBytes());
        PDF pdf = new PDF();
        pdf.setTitle(title != null ? title : file.getOriginalFilename());
        pdf.setFilePath(filePath.toString());
        pdf.setItemType(LibraryItemType.PDF);
        Library library = libraryRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Library not found"));
        pdf.setLibrary(library);
        return pdf;
    }

    public LibraryItem uploadPDF(MultipartFile file, String title, UUID userId) throws IOException {
        return pdfRepository.save(createPDF(file, title, userId));
    }

    public LibraryItem uploadPDFToCourse(MultipartFile file, String title, String year, String semester, String description, UUID courseId, UUID userId) throws IOException {
        PDF savedPdf = pdfRepository.save(createPDF(file, title, userId));
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));
        CourseLibraryItem cli = new CourseLibraryItem();
        cli.setCourse(course);
        cli.setLibraryItem(savedPdf);
        cli.setYear(year == null || year.equals("Unknown") ? null : year);
        cli.setSemester(semester == null || semester.equals("Unknown") ? null : semester);
        cli.setDescription(description);
        courseLibraryItemRepository.save(cli);
        return savedPdf;
    }

    public void recordAccess(UUID itemId) {
        LibraryItem item = libraryItemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Item not found"));
        item.setLastAccessed(Instant.now());
        libraryItemRepository.save(item);

        UUID userId = item.getLibrary().getUser().getId();
        recommendationService.recordAccess(userId, itemId);
    }

    @Transactional
    public LibraryItem toggleItemStarred(UUID itemId) {
        LibraryItem item = libraryItemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Item not found"));
        item.setStarred(!item.isStarred());
        return item;
    }

}