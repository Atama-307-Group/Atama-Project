package com.atama.repository;

import com.atama.model.CourseRequest;
import com.atama.model.Status;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CourseRequestRepository extends JpaRepository<CourseRequest, UUID> {
    List<CourseRequest> findByStatus(Status status);
}
