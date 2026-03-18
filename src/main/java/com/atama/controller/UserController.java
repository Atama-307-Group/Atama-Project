package com.atama.controller;

import com.atama.dto.request.UserRegistrationRequest;
import com.atama.model.Course;
import com.atama.model.User;
import com.atama.service.PasswordResetService;
import com.atama.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final PasswordResetService passwordResetService;
    private final com.atama.service.EmailVerificationService emailVerificationService;

    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody Map<String, String> request) {
        String identifier = request.get("identifier"); // username or email
        String password = request.get("password");

        try {
            User user = userService.loginUser(identifier, password);
            java.util.Map<String, Object> response = new java.util.HashMap<>();
            response.put("id", user.getId().toString());
            response.put("username", user.getUsername());
            response.put("email", user.getEmail());
            response.put("profilePictureUrl", user.getProfilePictureUrl());
            response.put("verified", user.isVerified());
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<User> registerUser(@RequestBody UserRegistrationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.registerUser(request));
    }

    @PostMapping
    public ResponseEntity<User> createUser(@RequestBody User user) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.createUser(user));
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable UUID id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable UUID id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/delete-account")
    public ResponseEntity<?> deleteAccount(@PathVariable UUID id, @RequestBody Map<String, String> request) {
        String password = request.get("password");
        try {
            userService.deleteAccountWithPassword(id, password);
            return ResponseEntity.ok(Map.of("message", "Account deleted successfully."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{id}/change-password")
    public ResponseEntity<?> changePassword(@PathVariable UUID id, @RequestBody Map<String, String> request) {
        String oldPassword = request.get("oldPassword");
        String newPassword = request.get("newPassword");
        try {
            userService.changePassword(id, oldPassword, newPassword);
            return ResponseEntity.ok(Map.of("message", "Password changed successfully."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{id}/change-username")
    public ResponseEntity<?> changeUsername(@PathVariable UUID id, @RequestBody Map<String, String> request) {
        String newUsername = request.get("newUsername");
        String password = request.get("password");
        try {
            User user = userService.changeUsername(id, newUsername, password);
            return ResponseEntity.ok(Map.of(
                    "id", user.getId().toString(),
                    "username", user.getUsername(),
                    "email", user.getEmail()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> request) {
        String identifier = request.get("identifier");
        try {
            String email = passwordResetService.generateResetCode(identifier);
            // Mask the email for privacy
            String masked = email.substring(0, 2) + "***@" + email.substring(email.indexOf("@") + 1);
            return ResponseEntity.ok(Map.of(
                    "message", "A reset code has been sent to " + masked));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        String code = request.get("code");
        String newPassword = request.get("newPassword");
        try {
            passwordResetService.resetPassword(code, newPassword);
            return ResponseEntity.ok(Map.of("message", "Password reset successfully."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{id}/upload-profile-picture")
    public ResponseEntity<?> uploadProfilePicture(@PathVariable UUID id, @RequestBody Map<String, String> request) {
        String profilePictureUrl = request.get("profilePictureUrl");
        try {
            userService.updateProfilePicture(id, profilePictureUrl);
            return ResponseEntity
                    .ok(Map.of("message", "Profile picture updated.", "profilePictureUrl", profilePictureUrl));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/{id}/profile-picture")
    public ResponseEntity<?> getProfilePicture(@PathVariable UUID id) {
        try {
            User user = userService.getUserById(id);
            String url = user.getProfilePictureUrl();
            return ResponseEntity.ok(Map.of("profilePictureUrl", url != null ? url : ""));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/send-verification")
    public ResponseEntity<?> sendVerification(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        if (email == null || !email.toLowerCase().endsWith("@purdue.edu")) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Only @purdue.edu emails can be verified."));
        }
        try {
            emailVerificationService.sendVerificationCode(email);
            return ResponseEntity.ok(Map.of("message", "Verification code sent to " + email));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/register-verified")
    public ResponseEntity<?> registerVerified(@RequestBody Map<String, String> request) {
        String username = request.get("username");
        String email = request.get("email");
        String password = request.get("password");
        String code = request.get("code");

        if (email == null || !email.toLowerCase().endsWith("@purdue.edu")) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Only @purdue.edu emails can be verified."));
        }

        try {
            emailVerificationService.verifyCode(email, code);

            UserRegistrationRequest regRequest = new UserRegistrationRequest();
            regRequest.setUsername(username);
            regRequest.setEmail(email);
            regRequest.setPassword(password);

            User user = userService.registerUser(regRequest);
            user.setVerified(true);
            userService.createUser(user);

            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "message", "Account created and verified!",
                    "id", user.getId().toString(),
                    "username", user.getUsername(),
                    "email", user.getEmail(),
                    "verified", true));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/{id}/enrolled-courses")
    public ResponseEntity<List<Course>> getEnrolledCourses(@PathVariable UUID id) {
        return ResponseEntity.ok(userService.getEnrolledCourses(id));
    }

    @PostMapping("/{id}/enroll")
    public ResponseEntity<?> enrollInCourse(@PathVariable UUID id, @RequestBody Map<String, String> request) {
        try {
            UUID courseId = UUID.fromString(request.get("courseId"));
            userService.enrollInCourse(id, courseId);
            return ResponseEntity.ok(Map.of("message", "Enrolled successfully."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/{userId}/unenroll/{courseId}")
    public ResponseEntity<Void> unenrollFromCourse(@PathVariable UUID userId, @PathVariable UUID courseId) {
        userService.unenrollFromCourse(userId, courseId);
        return ResponseEntity.noContent().build();
    }
}
