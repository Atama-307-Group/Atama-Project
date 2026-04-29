package com.atama.service;

import com.atama.dto.request.LibraryItemRequestDTO;
import com.atama.dto.response.ConceptMapResponseDTO;
import com.atama.model.ConceptMap;
import com.atama.model.Flashcard;
import com.atama.model.FlashcardSet;
import com.atama.model.NormalFlashcard;
import com.atama.repository.ConceptMapRepository;
import com.atama.repository.FlashcardRepository;
import com.atama.repository.FlashcardSetRepository;
import com.atama.repository.LibraryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

@Service
@RequiredArgsConstructor
@Transactional
public class ConceptMapService {

    private final ConceptMapRepository conceptMapRepository;
    private final FlashcardRepository flashcardRepository;
    private final FlashcardSetRepository flashcardSetRepository;
    private final GeminiService geminiService;
    private final LibraryItemService libraryItemService;
    private final LibraryRepository libraryRepository;

    public ConceptMapResponseDTO generateAndSave(UUID setId, List<UUID> cardIds, String title, boolean isPublic, UUID userId) {
        FlashcardSet set = flashcardSetRepository.findById(setId)
                .orElseThrow(() -> new RuntimeException("Flashcard set not found"));

        List<Flashcard> selectedCards = flashcardRepository.findAllById(cardIds);
        
        // Ensure all selected cards actually belong to this user/library before using them contextually
        // (For now just use the text of normal flashcards)
        String flashcardText = selectedCards.stream()
                .filter(c -> c instanceof NormalFlashcard)
                .map(c -> ((NormalFlashcard) c).getTerm() + ": " + ((NormalFlashcard) c).getDefinition())
                .collect(Collectors.joining("\n"));

        if (flashcardText.isBlank()) {
            throw new IllegalArgumentException("No valid content found in selected flashcards.");
        }

        String graphData = geminiService.generateConceptMap(flashcardText);

        ConceptMap conceptMap = new ConceptMap();
        conceptMap.setGraphData(graphData);
        conceptMap.setSourceSetId(setId);

        LibraryItemRequestDTO mockDto = new LibraryItemRequestDTO();
        mockDto.setTitle(title != null && !title.isBlank() ? title : set.getTitle() + " - Concept Map");
        mockDto.setPublic(isPublic);
        
        libraryItemService.initializeLibraryItem(conceptMap, mockDto, userId);
        conceptMap.setPublic(isPublic);

        ConceptMap saved = conceptMapRepository.save(conceptMap);
        
        return toDto(saved, userId);
    }

    public ConceptMapResponseDTO createManualMap(UUID setId, List<UUID> cardIds, String title, boolean isPublic, UUID userId) {
        FlashcardSet set = flashcardSetRepository.findById(setId)
                .orElseThrow(() -> new RuntimeException("Flashcard set not found"));

        List<Flashcard> selectedCards = flashcardRepository.findAllById(cardIds);
        
        ObjectMapper mapper = new ObjectMapper();
        ObjectNode rootNode = mapper.createObjectNode();
        ArrayNode nodesArray = mapper.createArrayNode();
        
        for (Flashcard c : selectedCards) {
            if (c instanceof NormalFlashcard) {
                ObjectNode n = mapper.createObjectNode();
                n.put("id", "node_" + UUID.randomUUID().toString().substring(0, 8));
                n.put("label", ((NormalFlashcard) c).getTerm());
                n.put("type", "sub");
                nodesArray.add(n);
            }
        }
        rootNode.set("nodes", nodesArray);
        rootNode.set("edges", mapper.createArrayNode());

        ConceptMap conceptMap = new ConceptMap();
        conceptMap.setGraphData(rootNode.toString());
        conceptMap.setSourceSetId(setId);

        LibraryItemRequestDTO mockDto = new LibraryItemRequestDTO();
        mockDto.setTitle(title != null && !title.isBlank() ? title : set.getTitle() + " - Concept Map");
        mockDto.setPublic(isPublic);
        
        libraryItemService.initializeLibraryItem(conceptMap, mockDto, userId);
        conceptMap.setPublic(isPublic);

        ConceptMap saved = conceptMapRepository.save(conceptMap);
        
        return toDto(saved, userId);
    }
    
    public ConceptMapResponseDTO addPngToMap(UUID mapId, String pngPath, UUID userId) {
        ConceptMap map = conceptMapRepository.findById(mapId)
            .orElseThrow(() -> new RuntimeException("Concept map not found"));
            
        // Make sure it belongs to user
        if (!map.getLibrary().getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }
        
        map.setPngPath(pngPath);
        return toDto(conceptMapRepository.save(map), userId);
    }

    public ConceptMapResponseDTO updateConceptMapGraph(UUID id, UUID userId, String newGraphData) {
        ConceptMap map = conceptMapRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Concept map not found"));
                
        if (!map.getLibrary().getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }
        
        map.setGraphData(newGraphData);
        return toDto(conceptMapRepository.save(map), userId);
    }

    public ConceptMapResponseDTO getById(UUID id, UUID userId) {
        ConceptMap map = conceptMapRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Concept map not found"));
                
        // Ensure user owns this or it is public
        if (!map.getLibrary().getUser().getId().equals(userId) && !map.isPublic()) {
           throw new RuntimeException("Unauthorized"); 
        }

        return toDto(map, userId);
    }

    public ConceptMapResponseDTO updatePrivacy(UUID id, boolean isPublic, UUID requesterId) {
        ConceptMap map = conceptMapRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Concept map not found"));
        
        if (!map.getLibrary().getUser().getId().equals(requesterId)) {
            throw new RuntimeException("Unauthorized");
        }
        
        map.setPublic(isPublic);
        return toDto(conceptMapRepository.save(map), requesterId);
    }

    public List<ConceptMapResponseDTO> getMyMaps(UUID userId) {
        com.atama.model.Library library = libraryRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Library not found"));
        return conceptMapRepository.findByLibraryId(library.getId()).stream()
                .map(map -> toDto(map, userId))
                .collect(Collectors.toList());
    }

    private ConceptMapResponseDTO toDto(ConceptMap map, UUID requesterId) {
        ConceptMapResponseDTO dto = new ConceptMapResponseDTO();
        dto.setId(map.getId());
        dto.setTitle(map.getTitle());
        dto.setGraphData(map.getGraphData());
        dto.setPngPath(map.getPngPath());
        dto.setSourceSetId(map.getSourceSetId());
        dto.setCreatedAt(map.getCreatedAt());
        dto.setPublic(map.isPublic());
        if (requesterId != null) {
            dto.setOwner(map.getLibrary().getUser().getId().equals(requesterId));
        }
        return dto;
    }
}
