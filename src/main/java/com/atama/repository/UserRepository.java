package com.atama.repository;

import com.atama.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    boolean existsByEmail(String email);

    boolean existsByUsername(String username);

    java.util.Optional<User> findByUsername(String username);

    java.util.Optional<User> findByEmail(String email);

    Optional<User> findById(UUID id);

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.goal WHERE u.id IN :ids")
    List<User> findAllByIdWithGoal(@Param("ids") List<UUID> ids);

    @Query("SELECT u FROM User u WHERE LOWER(u.username) LIKE LOWER(CONCAT('%', :q, '%'))")
    List<User> searchByUsername(@Param("q") String q);

}
