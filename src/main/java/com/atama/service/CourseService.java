package com.atama.service;

import com.atama.model.Course;
import com.atama.repository.CourseRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class CourseService {

    private final CourseRepository courseRepository;

    public CourseService(CourseRepository courseRepository) {
        this.courseRepository = courseRepository;
    }

    @Transactional(readOnly = true)
    public List<Course> getCoursesByUniversityId(UUID universityId) {
        return courseRepository.findByUniversityId(universityId);
    }
}