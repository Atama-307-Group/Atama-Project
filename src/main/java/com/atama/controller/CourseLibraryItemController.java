package com.atama.controller;

import com.atama.dto.response.CourseLibraryItemResponseDTO;
import com.atama.dto.response.LibraryItemResponseDTO;
import com.atama.model.Course;
import com.atama.model.CourseLibraryItem;
import com.atama.model.LibraryItem;
import com.atama.repository.CourseLibraryItemRepository;
import com.atama.repository.CourseRepository;
import com.atama.repository.LibraryItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/course-library-items")
@RequiredArgsConstructor
public class CourseLibraryItemController {

    private final CourseLibraryItemRepository courseLibraryItemRepository;
    private final CourseRepository courseRepository;
    private final LibraryItemRepository libraryItemRepository;

    private CourseLibraryItemResponseDTO toDTO(CourseLibraryItem cli) {
        LibraryItem li = cli.getLibraryItem();
        LibraryItemResponseDTO liDTO = new LibraryItemResponseDTO();
        liDTO.setId(li.getId());
        liDTO.setTitle(li.getTitle());
        liDTO.setItemType(li.getItemType());
        liDTO.setOwnerId(li.getOwner() != null ? li.getOwner().getId() : null);

        return new CourseLibraryItemResponseDTO(
                cli.getId(), cli.getYear(), cli.getSemester(), cli.getDescription(), liDTO
        );
    }

    @GetMapping("/course/{courseId}")
    public ResponseEntity<List<CourseLibraryItemResponseDTO>> getItemsByCourse(@PathVariable UUID courseId) {
        return ResponseEntity.ok(
                courseLibraryItemRepository.findByCourseId(courseId)
                        .stream().map(this::toDTO).toList()
        );
    }

    @PostMapping
    public ResponseEntity<CourseLibraryItemResponseDTO> addItem(@RequestBody AddItemRequest body) {
        Course course = courseRepository.findById(body.courseId())
                .orElseThrow(() -> new RuntimeException("Course not found"));
        LibraryItem libraryItem = libraryItemRepository.findById(body.libraryItemId())
                .orElseThrow(() -> new RuntimeException("Library item not found"));

        CourseLibraryItem item = new CourseLibraryItem();
        item.setCourse(course);
        item.setLibraryItem(libraryItem);
        item.setYear(body.year());
        item.setSemester(body.semester());
        item.setDescription(body.description());

        return ResponseEntity.ok(toDTO(courseLibraryItemRepository.save(item)));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<CourseLibraryItemResponseDTO> updateItem(@PathVariable UUID id, @RequestBody UpdateItemRequest body) {
        CourseLibraryItem item = courseLibraryItemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Item not found"));

        item.setYear(body.year());
        item.setSemester(body.semester());
        item.setDescription(body.description());

        return ResponseEntity.ok(toDTO(courseLibraryItemRepository.save(item)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteItem(@PathVariable UUID id) {
        courseLibraryItemRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    public record UpdateItemRequest(String year, String semester, String description) {}

    public record AddItemRequest(UUID courseId, UUID libraryItemId, String year, String semester, String description) {}
}
