package com.atama.service;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import jakarta.servlet.http.Cookie;
import java.security.Key;
import java.util.Date;
import java.util.UUID;

@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration-ms}")
    private long expirationMs;

    @Value("${admin.email}")
    private String adminEmail;


    public String generateToken(UUID userId, String username, String email) {
        Key key = Keys.hmacShaKeyFor(secret.getBytes());

        return Jwts.builder()
                .subject(userId.toString())
                .claim("username", username)
                .claim("isAdmin", email.equals(adminEmail))
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expirationMs))
                .signWith(key)
                .compact();
    }

    public UUID extractUserId(String token) {
        Key key = Keys.hmacShaKeyFor(secret.getBytes());
        return UUID.fromString(Jwts.parser()
                .verifyWith((javax.crypto.SecretKey) key)
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject());
    }

    public Cookie createAuthCookie(String token) {
        Cookie cookie = new Cookie("jwt", token);
        cookie.setHttpOnly(true);
        // cookie.setSecure(true); // HTTPS only
        cookie.setPath("/");
        cookie.setMaxAge((int) (expirationMs / 1000)); // match token lifetime
        return cookie;
    }
}