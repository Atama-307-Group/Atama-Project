package com.atama.service;

import com.atama.model.University;
import com.atama.model.User;
import com.atama.repository.UniversityRepository;
import com.atama.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;


@Service
public class UniversityService {

    private final UniversityRepository universityRepository;
    private final UserRepository userRepository;

    public UniversityService(UniversityRepository universityRepository, UserRepository userRepository) {
        this.universityRepository = universityRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public University getUniversityByUserId(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        if (user.getUniversity() == null) {
            throw new IllegalArgumentException("No university linked to user: " + userId);
        }

        return user.getUniversity();
    }
}