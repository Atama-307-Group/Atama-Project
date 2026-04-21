package com.atama.service;

import com.atama.dto.request.CreateCourseRequestDTO;
import com.atama.model.CourseRequest;
import com.atama.repository.CourseRequestRepository;
import com.atama.repository.UniversityRepository;
import com.atama.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CourseRequestService {

    private final CourseRequestRepository courseRequestRepository;
    private final UniversityRepository universityRepository;
    private final UserRepository userRepository;

    public void createRequest(CreateCourseRequestDTO dto) {
        CourseRequest request = new CourseRequest();
        request.setCode(dto.getCode());
        request.setName(dto.getName());
        request.setUniversity(universityRepository.getReferenceById(dto.getUniversityId()));
        request.setUser(userRepository.getReferenceById(dto.getUserId()));
        courseRequestRepository.save(request);
    }
}