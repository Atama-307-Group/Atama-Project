package com.atama.controller;

import com.atama.dto.response.SearchResponseDTO;
import com.atama.service.SearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/search")
@RequiredArgsConstructor
public class SearchController {

    private final SearchService searchService;

    @GetMapping
    public ResponseEntity<SearchResponseDTO> search(@RequestParam String q) {
        UUID userId = getAuthenticatedUserId();
        return ResponseEntity.ok(searchService.search(q, userId));
    }

    private UUID getAuthenticatedUserId() {
        String userId = (String) SecurityContextHolder.getContext()
                .getAuthentication()
                .getPrincipal();
        return UUID.fromString(userId);
    }
}