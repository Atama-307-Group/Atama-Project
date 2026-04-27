package com.atama.repository;

import com.atama.model.NudgeNotification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface NudgeNotificationRepository extends JpaRepository<NudgeNotification, UUID> {

    List<NudgeNotification> findByUserIdOrderByCreatedAtAsc(UUID userId);

    void deleteByUserId(UUID userId);
}
