package com.atama.service;

import com.atama.dto.request.UserRegistrationRequest;
import com.atama.dto.response.LoginResult;
import com.atama.exception.ResourceNotFoundException;
import com.atama.model.Library;
import com.atama.model.University;
import com.atama.model.User;
import com.atama.model.Course;
import com.atama.repository.CourseRepository;
import com.atama.repository.LibraryRepository;
import com.atama.repository.UniversityRepository;
import com.atama.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final LibraryRepository libraryRepository;
    private final UniversityRepository universityRepository;
    private final LibraryService libraryService;
    private final JwtService jwtService;

    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    private final CourseRepository courseRepository;

    public User registerUser(UserRegistrationRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email is already in use.");
        }
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username is already taken.");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        String emailDomain = request.getEmail().substring(request.getEmail().indexOf("@") + 1);
        University university = universityRepository.findByEmailDomain(emailDomain)
                .orElseGet(() -> {
                    University newUniversity = new University();
                    newUniversity.setEmailDomain(emailDomain);
                    newUniversity.setName(emailDomain); // fallback name
                    return universityRepository.save(newUniversity);
                });

        user.setUniversity(university);

        User savedUser = userRepository.save(user);

        // Create a Library for the new user and persist it
        Library library = new Library();
        library.setUser(savedUser);
        libraryRepository.save(library);

        return savedUser;
    }

//    public User loginUser(String identifier, String password) {
//        // Try finding by username first, then by email
//        User user = userRepository.findByUsername(identifier)
//                .orElseGet(() -> userRepository.findByEmail(identifier)
//                        .orElseThrow(() -> new IllegalArgumentException("Invalid username/email or password.")));
//
//        if (!passwordEncoder.matches(password, user.getPassword())) {
//            throw new IllegalArgumentException("Invalid username/email or password.");
//        }
//
//        return user;
//    }
    public LoginResult loginUser(String identifier, String password) {
        User user = userRepository.findByUsername(identifier)
                .orElseGet(() -> userRepository.findByEmail(identifier)
                        .orElseThrow(() -> new IllegalArgumentException("Invalid username/email or password.")));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new IllegalArgumentException("Invalid username/email or password.");
        }

        String token = jwtService.generateToken(user.getId(), user.getUsername());
        return new LoginResult(user, token);
    }

    public User createUser(User user) {
        return userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public User getUserById(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
    }

    @Transactional(readOnly = true)
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public void deleteUser(UUID id) {
        if (!userRepository.existsById(id)) {
            throw new ResourceNotFoundException("User", "id", id);
        }
        userRepository.deleteById(id);
    }

    public void deleteAccountWithPassword(UUID id, String password) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new IllegalArgumentException("Incorrect password.");
        }

        userRepository.delete(user);
    }

    public void changePassword(UUID id, String oldPassword, String newPassword) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));

        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new IllegalArgumentException("Current password is incorrect.");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    public User changeUsername(UUID id, String newUsername, String password) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new IllegalArgumentException("Incorrect password.");
        }

        if (userRepository.existsByUsername(newUsername)) {
            throw new IllegalArgumentException("Username is already taken.");
        }

        user.setUsername(newUsername);
        return userRepository.save(user);
    }

    public void updateProfilePicture(UUID id, String profilePictureUrl) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        user.setProfilePictureUrl(profilePictureUrl);
        userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public List<Course> getEnrolledCourses(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        return user.getEnrolledCourses();
    }

    public void enrollInCourse(UUID userId, UUID courseId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", courseId));

        if (!user.getEnrolledCourses().contains(course)) {
            user.getEnrolledCourses().add(course);
            userRepository.save(user);
        }
    }

    public void unenrollFromCourse(UUID userId, UUID courseId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", courseId));

        user.getEnrolledCourses().remove(course);
        userRepository.save(user);
    }

    public void unenrollFromAllCourses(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        // Clear all courses
        user.getEnrolledCourses().clear();

        // Save the user — Hibernate deletes all join table entries
        userRepository.save(user);
    }

    public void updateAiDisabled(UUID userId, boolean aiDisabled) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setAiDisabled(aiDisabled);
        userRepository.save(user);
    }

    public void updateRecommendationsEnabled(UUID userId, boolean enabled) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setRecommendationsEnabled(enabled);
        userRepository.save(user);
    }
}
