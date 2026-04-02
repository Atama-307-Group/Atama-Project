package com.atama.controller;

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

    @GetMapping("/course/{courseId}")
    public ResponseEntity<List<CourseLibraryItem>> getItemsByCourse(@PathVariable UUID courseId) {
        return ResponseEntity.ok(courseLibraryItemRepository.findByCourseId(courseId));
    }

    @PostMapping
    public ResponseEntity<CourseLibraryItem> addItem(@RequestBody AddItemRequest body) {
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

        return ResponseEntity.ok(courseLibraryItemRepository.save(item));
    }

    public record AddItemRequest(UUID courseId, UUID libraryItemId, String year, String semester, String description) {}
}
