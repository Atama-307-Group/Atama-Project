package com.atama.service;

import com.atama.dto.request.CreateReportDTO;
import com.atama.model.Report;
import com.atama.model.Status;
import com.atama.repository.LibraryItemRepository;
import com.atama.repository.ReportRepository;
import com.atama.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class ReportService {

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;
    private final LibraryItemRepository libraryItemRepository;

    public void createReport(CreateReportDTO dto, UUID userId) {
        Report report = new Report();
        report.setUser(userRepository.getReferenceById(userId));
        report.setType(dto.getType());
        report.setDescription(dto.getDescription());
        report.setStatus(Status.PENDING);

        if (dto.getReportedUserId() != null) {
            report.setReportedUser(userRepository.getReferenceById(dto.getReportedUserId()));
        }
        if (dto.getReportedLibraryItemId() != null) {
            report.setReportedLibraryItem(libraryItemRepository.getReferenceById(dto.getReportedLibraryItemId()));
        }

        reportRepository.save(report);
    }
}