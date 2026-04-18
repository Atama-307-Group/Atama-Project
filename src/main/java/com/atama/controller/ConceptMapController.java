package com.atama.controller;

import com.atama.dto.response.ConceptMapResponseDTO;
import com.atama.service.ConceptMapService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/concept-maps")
@RequiredArgsConstructor
public class ConceptMapController {

    private final ConceptMapService conceptMapService;

    @PostMapping("/generate")
    public ResponseEntity<ConceptMapResponseDTO> generateAndSave(@RequestBody Map<String, Object> request) {
        UUID setId = UUID.fromString((String) request.get("setId"));
        List<String> cardIdStrings = (List<String>) request.get("selectedCardIds");
        List<UUID> cardIds = cardIdStrings.stream().map(UUID::fromString).toList();
        String title = (String) request.get("title");

        ConceptMapResponseDTO dto = conceptMapService.generateAndSave(setId, cardIds, title, getAuthenticatedUserId());
        return ResponseEntity.ok(dto);
    }
    
    @PostMapping("/{id}/png")
    public ResponseEntity<ConceptMapResponseDTO> uploadPng(@PathVariable UUID id, @RequestParam("file") MultipartFile file) throws IOException {
        String uploadsDir = "uploads/";
        Files.createDirectories(Paths.get(uploadsDir));
        String fileName = UUID.randomUUID() + ".png";
        Path filePath = Paths.get(uploadsDir + fileName);
        Files.write(filePath, file.getBytes());
        
        ConceptMapResponseDTO dto = conceptMapService.addPngToMap(id, filePath.toString(), getAuthenticatedUserId());
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ConceptMapResponseDTO> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(conceptMapService.getById(id, getAuthenticatedUserId()));
    }

    @GetMapping("/my-maps")
    public ResponseEntity<List<ConceptMapResponseDTO>> getMyMaps() {
        return ResponseEntity.ok(conceptMapService.getMyMaps(getAuthenticatedUserId()));
    }

    @PutMapping("/{id}/graph")
    public ResponseEntity<ConceptMapResponseDTO> updateGraph(
            @PathVariable UUID id, 
            @RequestBody Map<String, String> request) {
        String newGraphData = request.get("graphData");
        ConceptMapResponseDTO dto = conceptMapService.updateConceptMapGraph(id, getAuthenticatedUserId(), newGraphData);
        return ResponseEntity.ok(dto);
    }

    private UUID getAuthenticatedUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            throw new RuntimeException("Unauthenticated");
        }
        return UUID.fromString((String) auth.getPrincipal());
    }
}
