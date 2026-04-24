package com.atama.repository;

import com.atama.model.Report;
import com.atama.model.Status;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ReportRepository extends JpaRepository<Report, UUID> {
    List<Report> findByStatus(Status status);
}
