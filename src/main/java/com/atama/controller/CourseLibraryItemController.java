package com.atama.controller;

import com.atama.model.CourseLibraryItem;
import com.atama.repository.CourseLibraryItemRepository;
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

    @GetMapping("/course/{courseId}")
    public ResponseEntity<List<CourseLibraryItem>> getItemsByCourse(@PathVariable UUID courseId) {
        return ResponseEntity.ok(courseLibraryItemRepository.findByCourseId(courseId));
    }
}