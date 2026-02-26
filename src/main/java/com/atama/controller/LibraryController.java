package com.atama.controller;

import com.atama.model.Library;
import com.atama.service.LibraryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/libraries")
@RequiredArgsConstructor
public class LibraryController {

    private final LibraryService libraryService;

    @GetMapping("/{id}")
    public ResponseEntity<Library> getLibraryById(@PathVariable Long id) {
        return ResponseEntity.ok(libraryService.getLibraryById(id));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<Library> getLibraryByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(libraryService.getLibraryByUserId(userId));
    }

    @PatchMapping("/privacy")
    public void updatePrivacy(@RequestParam boolean isPrivate) {
        //UUID userId = getCurrentUserId(); // however you're extracting it
        //libraryService.setLibraryPrivacy(userId, isPrivate);
    }
}
