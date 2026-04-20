package com.atama.service;

import com.atama.dto.request.CourseRequestDTO;
import com.atama.dto.request.ReportDTO;
import com.atama.exception.ResourceNotFoundException;
import com.atama.model.Course;
import com.atama.model.CourseRequest;
import com.atama.model.Report;
import com.atama.model.Status;
import com.atama.repository.CourseRepository;
import com.atama.repository.CourseRequestRepository;
import com.atama.repository.ReportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class AdminService {

    private final ReportRepository reportRepository;
    private final CourseRequestRepository courseRequestRepository;
    private final CourseRepository courseRepository;

    public List<ReportDTO> getPendingReports() {
        return reportRepository.findByStatus(Status.PENDING)
                .stream().map(ReportDTO::from).toList();
    }

    public void resolveReport(UUID id, Status status) {
        Report report = reportRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Report", "id", id));
        report.setStatus(status);
        report.setResolvedAt(Instant.now());
        reportRepository.save(report);
    }

    public List<CourseRequestDTO> getPendingCourseRequests() {
        return courseRequestRepository.findByStatus(Status.PENDING)
                .stream().map(CourseRequestDTO::from).toList();
    }

    public void resolveCourseRequest(UUID id, Status status) {
        CourseRequest req = courseRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("CourseRequest", "id", id));
        req.setStatus(status);

        // If approved, create the actual course
        if (status == Status.APPROVED) {
            Course course = new Course();
            course.setCourseCode(req.getCode());
            course.setCourseName(req.getName());
            course.setUniversity(req.getUniversity());
            courseRepository.save(course);
        }

        courseRequestRepository.save(req);
    }
}