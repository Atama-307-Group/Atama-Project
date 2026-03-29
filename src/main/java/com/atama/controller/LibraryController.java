package com.atama.controller;

import com.atama.model.Library;
import com.atama.service.LibraryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/libraries")
@RequiredArgsConstructor
public class LibraryController {

    private final LibraryService libraryService;

    @GetMapping("/{id}")
    public ResponseEntity<Library> getLibraryById(@PathVariable UUID id) {
        return ResponseEntity.ok(libraryService.getLibraryById(id));
    }

    /*@GetMapping("/user/{userId}")
    public ResponseEntity<Library> getLibraryByUserId(@PathVariable UUID userId) {
        return ResponseEntity.ok(libraryService.getLibraryByUserId(userId));
    }

    @PatchMapping("/privacy")
    public void updatePrivacy(@RequestParam boolean isPrivate) {
        //UUID userId = getCurrentUserId(); // however you're extracting it
        //libraryService.setLibraryPrivacy(userId, isPrivate);
    }*/
    @GetMapping("/me")
    public ResponseEntity<Library> getMyLibrary() {
        UUID userId = getAuthenticatedUserId();
        return ResponseEntity.ok(libraryService.getLibraryByUserId(userId));
    }

    @PatchMapping("/privacy")
    public ResponseEntity<?> updatePrivacy(@RequestParam boolean isPrivate) {
        UUID userId = getAuthenticatedUserId();           // ← was commented out
        libraryService.setLibraryPrivacy(userId, isPrivate);
        return ResponseEntity.ok(Map.of("message", "Privacy updated."));
    }

    private UUID getAuthenticatedUserId() {
        String userId = (String) SecurityContextHolder.getContext()
                .getAuthentication()
                .getPrincipal();
        return UUID.fromString(userId);
    }
}
