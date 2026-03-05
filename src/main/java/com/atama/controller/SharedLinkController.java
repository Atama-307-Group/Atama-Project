package com.atama.controller;

import com.atama.dto.response.FlashcardSetResponseDTO;
import com.atama.service.SharedLinkService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/shared-links")
@RequiredArgsConstructor
public class SharedLinkController {

    private final SharedLinkService sharedLinkService;

    @PostMapping
    public ResponseEntity<Map<String, String>> generateLink(@RequestBody Map<String, UUID> body) {
        String token = sharedLinkService.generateLink(body.get("flashcardSetId"));
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("token", token));
    }

    @GetMapping("/{token}")
    public ResponseEntity<FlashcardSetResponseDTO> resolveLink(@PathVariable String token) {
        return ResponseEntity.ok(sharedLinkService.resolveLink(token));
    }
}
