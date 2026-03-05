package com.atama.service;

import com.atama.dto.response.FlashcardSetResponseDTO;
import com.atama.exception.LinkExpiredException;
import com.atama.exception.ResourceNotFoundException;
import com.atama.mapper.FlashcardSetMapper;
import com.atama.model.FlashcardSet;
import com.atama.model.SharedLink;
import com.atama.repository.FlashcardSetRepository;
import com.atama.repository.SharedLinkRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class SharedLinkService {

    private final SharedLinkRepository sharedLinkRepository;
    private final FlashcardSetRepository flashcardSetRepository;
    private final FlashcardSetMapper flashcardSetMapper;

    public String generateLink(UUID flashcardSetId) {
        flashcardSetRepository.findById(flashcardSetId)
                .orElseThrow(() -> new ResourceNotFoundException("FlashcardSet", "id", flashcardSetId));

        SharedLink link = new SharedLink();
        link.setToken(UUID.randomUUID().toString());
        link.setFlashcardSetId(flashcardSetId);
        link.setExpiresAt(Instant.now().plus(7, ChronoUnit.DAYS));
        return sharedLinkRepository.save(link).getToken();
    }

    @Transactional
    public FlashcardSetResponseDTO resolveLink(String token) {
        SharedLink link = sharedLinkRepository.findByToken(token)
                .orElseThrow(() -> new ResourceNotFoundException("SharedLink", "token", token));

        if (Instant.now().isAfter(link.getExpiresAt())) {
            throw new LinkExpiredException(token);
        }

        FlashcardSet set = flashcardSetRepository.findById(link.getFlashcardSetId())
                .orElseThrow(() -> new ResourceNotFoundException("FlashcardSet", "id", link.getFlashcardSetId()));

        return flashcardSetMapper.toResponseDTO(set);
    }
}