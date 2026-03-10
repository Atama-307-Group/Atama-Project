package com.atama.repository;

import com.atama.model.PDF;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface PDFRepository extends JpaRepository<PDF, UUID> {}