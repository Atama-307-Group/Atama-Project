package com.atama.service;

import com.atama.model.User;
import com.atama.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class PasswordResetService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    // In-memory store: code -> { userId, expiry }
    private final Map<String, ResetToken> resetTokens = new ConcurrentHashMap<>();

    private static final int CODE_LENGTH = 6;
    private static final long EXPIRY_MINUTES = 15;

    public String generateResetCode(String identifier) {
        // Find user by username or email
        User user = userRepository.findByUsername(identifier)
                .orElseGet(() -> userRepository.findByEmail(identifier)
                        .orElseThrow(
                                () -> new IllegalArgumentException("No account found with that username or email.")));

        // Generate a 6-digit numeric code
        SecureRandom random = new SecureRandom();
        StringBuilder code = new StringBuilder();
        for (int i = 0; i < CODE_LENGTH; i++) {
            code.append(random.nextInt(10));
        }

        String resetCode = code.toString();
        Instant expiry = Instant.now().plusSeconds(EXPIRY_MINUTES * 60);

        resetTokens.put(resetCode, new ResetToken(user.getId().toString(), expiry));

        // Log the code to the console (in production, send via email)
        System.out.println("========================================");
        System.out.println("PASSWORD RESET CODE for " + user.getEmail());
        System.out.println("Code: " + resetCode);
        System.out.println("Expires in " + EXPIRY_MINUTES + " minutes");
        System.out.println("========================================");

        return user.getEmail();
    }

    public void resetPassword(String code, String newPassword) {
        ResetToken token = resetTokens.get(code);

        if (token == null) {
            throw new IllegalArgumentException("Invalid reset code.");
        }

        if (Instant.now().isAfter(token.expiry())) {
            resetTokens.remove(code);
            throw new IllegalArgumentException("Reset code has expired. Please request a new one.");
        }

        Optional<User> userOpt = userRepository.findById(java.util.UUID.fromString(token.userId()));
        if (userOpt.isEmpty()) {
            resetTokens.remove(code);
            throw new IllegalArgumentException("User account not found.");
        }

        User user = userOpt.get();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Remove used token
        resetTokens.remove(code);
    }

    private record ResetToken(String userId, Instant expiry) {
    }
}
