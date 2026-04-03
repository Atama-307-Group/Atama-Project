package com.atama.service;

import com.atama.model.*;
import com.atama.model.FlashcardProgress.KnowledgeLevel;
import com.atama.repository.*;
import com.atama.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class FlashcardProgressService {

    private final FlashcardProgressRepository progressRepository;
    private final FlashcardRepository flashcardRepository;
    private final FlashcardSetRepository flashcardSetRepository;
    private final SetStudyTimeRepository studyTimeRepository;

    /**
     * Returns all progress rows for this user+set.
     * Creates DONT_KNOW rows for any cards that don't have one yet.
     */
    @Transactional
    public List<FlashcardProgress> getOrInitProgress(UUID userId, UUID setId) {
        flashcardSetRepository.findById(setId)
                .orElseThrow(() -> new ResourceNotFoundException("FlashcardSet", "id", setId));

        List<Flashcard> allCards = flashcardRepository.findByFlashcardSetId(setId);
        List<FlashcardProgress> existing = progressRepository.findByUserIdAndSetId(userId, setId);

        for (Flashcard card : allCards) {
            boolean alreadyExists = existing.stream()
                    .anyMatch(p -> p.getFlashcard().getId().equals(card.getId()));
            if (!alreadyExists) {
                FlashcardProgress p = new FlashcardProgress();
                p.setUserId(userId);
                p.setFlashcard(card);
                p.setKnowledgeLevel(KnowledgeLevel.DONT_KNOW);
                existing.add(progressRepository.save(p));
            }
        }

        return existing;
    }

    /** Update the knowledge level for a single card. */
    @Transactional
    public FlashcardProgress updateKnowledgeLevel(UUID userId, UUID flashcardId, KnowledgeLevel level) {
        FlashcardProgress progress = progressRepository
                .findByUserIdAndFlashcard_Id(userId, flashcardId)
                .orElseGet(() -> {
                    Flashcard card = flashcardRepository.findById(flashcardId)
                            .orElseThrow(() -> new ResourceNotFoundException("Flashcard", "id", flashcardId));
                    FlashcardProgress p = new FlashcardProgress();
                    p.setUserId(userId);
                    p.setFlashcard(card);
                    return p;
                });

        progress.setKnowledgeLevel(level);
        return progressRepository.save(progress);
    }

    /** Add seconds to the cumulative study time for this user+set. */
    @Transactional
    public void addStudyTime(UUID userId, UUID setId, long seconds) {
        if (seconds <= 0) return;

        FlashcardSet set = flashcardSetRepository.findById(setId)
                .orElseThrow(() -> new ResourceNotFoundException("FlashcardSet", "id", setId));

        SetStudyTime record = studyTimeRepository
                .findByUserIdAndFlashcardSet_Id(userId, setId)
                .orElseGet(() -> {
                    SetStudyTime s = new SetStudyTime();
                    s.setUserId(userId);
                    s.setFlashcardSet(set);
                    return s;
                });

        record.setStudySeconds(record.getStudySeconds() + seconds);
        studyTimeRepository.save(record);
    }

    /** Aggregate stats for a set for this user. */
    @Transactional(readOnly = true)
    public SetProgressStats getStats(UUID userId, UUID setId) {
        List<FlashcardProgress> progress = progressRepository.findByUserIdAndSetId(userId, setId);

        long knowWell = progress.stream()
                .filter(p -> p.getKnowledgeLevel() == KnowledgeLevel.KNOW_WELL)
                .count();

        long totalStudySeconds = studyTimeRepository
                .findByUserIdAndFlashcardSet_Id(userId, setId)
                .map(SetStudyTime::getStudySeconds)
                .orElse(0L);

        int total = progress.size();
        double percent = total == 0 ? 0 : (double) knowWell / total * 100;

        return new SetProgressStats(Math.round(percent), totalStudySeconds, total);
    }

    public record SetProgressStats(long percentKnowWell, long totalStudySeconds, int totalCards) {}
}