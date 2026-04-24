package com.atama.repository;

import com.atama.model.Report;
import com.atama.model.Status;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface ReportRepository extends JpaRepository<Report, UUID> {
    List<Report> findByStatus(Status status);

    @Modifying
    @Query("UPDATE Report r SET r.user = null, r.reportedUser = null WHERE r.user.id = :userId OR r.reportedUser.id = :userId")
    void nullifyUser(@Param("userId") UUID userId);
}
