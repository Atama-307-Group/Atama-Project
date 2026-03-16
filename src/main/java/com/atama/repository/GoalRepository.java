package com.atama.repository;

import com.atama.model.Goal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface GoalRepository extends JpaRepository<Goal, UUID> {

    @org.springframework.data.jpa.repository.Query("SELECT g FROM Goal g JOIN FETCH g.user WHERE g.notifyByEmail = true")
    List<Goal> findByNotifyByEmailTrueWithUser();
}