package com.atama.service;

import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class EmailVerificationService {

    private final JavaMailSender mailSender;

    // In-memory store: email -> { code, expiry }
    private final Map<String, VerificationToken> verificationTokens = new ConcurrentHashMap<>();

    private static final int CODE_LENGTH = 6;
    private static final long EXPIRY_MINUTES = 15;

    public void sendVerificationCode(String email) {
        // Generate a 6-digit numeric code
        SecureRandom random = new SecureRandom();
        StringBuilder code = new StringBuilder();
        for (int i = 0; i < CODE_LENGTH; i++) {
            code.append(random.nextInt(10));
        }

        String verifyCode = code.toString();
        Instant expiry = Instant.now().plusSeconds(EXPIRY_MINUTES * 60);

        verificationTokens.put(email.toLowerCase(), new VerificationToken(verifyCode, expiry));

        // Send the verification email
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("Atama - Verify Your Purdue Email");
        message.setText(
                "Welcome to Atama!\n\n" +
                        "Your email verification code is: " + verifyCode + "\n\n" +
                        "This code will expire in " + EXPIRY_MINUTES + " minutes.\n\n" +
                        "Enter this code on the signup page to verify your Purdue email.\n\n" +
                        "— Atama Team");
        mailSender.send(message);

        System.out.println("Verification email sent to " + email);
    }

    public boolean verifyCode(String email, String code) {
        VerificationToken token = verificationTokens.get(email.toLowerCase());

        if (token == null) {
            throw new IllegalArgumentException("No verification code found for this email. Please request a new one.");
        }

        if (Instant.now().isAfter(token.expiry())) {
            verificationTokens.remove(email.toLowerCase());
            throw new IllegalArgumentException("Verification code has expired. Please request a new one.");
        }

        if (!token.code().equals(code)) {
            throw new IllegalArgumentException("Invalid verification code.");
        }

        // Code is valid — remove it
        verificationTokens.remove(email.toLowerCase());
        return true;
    }

    private record VerificationToken(String code, Instant expiry) {
    }
}
