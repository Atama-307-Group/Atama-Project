package com.atama.repository;

import com.atama.model.SharedLink;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface SharedLinkRepository extends JpaRepository<SharedLink, UUID> {
    Optional<SharedLink> findByToken(String token);
}