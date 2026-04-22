package com.atama.controller;

import com.atama.dto.request.CreateCourseRequestDTO;
import com.atama.service.CourseRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/course-requests")
@RequiredArgsConstructor
public class CourseRequestController {

    private final CourseRequestService courseRequestService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public void createCourseRequest(@RequestBody CreateCourseRequestDTO dto) {
        courseRequestService.createRequest(dto);
    }
}