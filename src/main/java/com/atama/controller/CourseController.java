package com.atama.controller;

import com.atama.model.Course;
import com.atama.repository.CourseRepository;
import com.atama.service.CourseService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/universities")
public class CourseController {

    private final CourseService courseService;
    private final CourseRepository courseRepository;


    public CourseController(CourseService courseService, CourseRepository courseRepository) {
        this.courseService = courseService;
        this.courseRepository = courseRepository;
    }

    @GetMapping("/{universityId}/courses")
    public ResponseEntity<List<Course>> getCourses(@PathVariable UUID universityId) {
        return ResponseEntity.ok(courseService.getCoursesByUniversityId(universityId));
    }

    @GetMapping("/course/{courseId}")
    public ResponseEntity<Course> getCourseById(@PathVariable UUID courseId) {
        return courseRepository.findById(courseId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}