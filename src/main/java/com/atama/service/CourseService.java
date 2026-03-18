package com.atama.service;

import com.atama.model.Course;
import com.atama.repository.CourseRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class CourseService {

    private final CourseRepository courseRepository;

    public CourseService(CourseRepository courseRepository) {
        this.courseRepository = courseRepository;
    }

    public List<Course> getCoursesByUniversityId(UUID universityId) {
        return courseRepository.findByUniversityId(universityId);
    }
}