package com.atama.service;

import com.atama.model.*;
import com.atama.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RecommendationService {

    private final RecentlyStudiedRepository recentlyStudiedRepository;
    private final LibraryItemRepository libraryItemRepository;

    private static final int MAX_RECENT = 10;

    public void recordAccess(UUID userId, UUID libraryItemId) {
        // Avoid duplicate entries for the same item
        if (recentlyStudiedRepository.existsByUserIdAndLibraryItemId(userId, libraryItemId)) {
            // Update timestamp by deleting and re-inserting
            recentlyStudiedRepository.findTop10ByUserIdOrderByAccessedAtDesc(userId)
                    .stream()
                    .filter(r -> r.getLibraryItemId().equals(libraryItemId))
                    .findFirst()
                    .ifPresent(r -> {
                        r.setAccessedAt(java.time.Instant.now());
                        recentlyStudiedRepository.save(r);
                    });
            return;
        }

        // Enforce max 10 entries per user
        long count = recentlyStudiedRepository.countByUserId(userId);
        if (count >= MAX_RECENT) {
            recentlyStudiedRepository.findByUserIdOrderByAccessedAtAsc(userId)
                    .stream().findFirst()
                    .ifPresent(recentlyStudiedRepository::delete);
        }

        RecentlyStudied entry = new RecentlyStudied();
        entry.setUserId(userId);
        entry.setLibraryItemId(libraryItemId);
        recentlyStudiedRepository.save(entry);
    }

    public Optional<Map<String, Object>> getRecommendation(UUID userId) {
        List<RecentlyStudied> recent = recentlyStudiedRepository
                .findTop10ByUserIdOrderByAccessedAtDesc(userId);

        if (recent.isEmpty()) return Optional.empty();

        // Collect metadata from recently studied items
        List<String> recentCourses = new ArrayList<>();
        List<String> recentUniversities = new ArrayList<>();
        List<String> recentTitles = new ArrayList<>();
        Set<UUID> recentIds = new HashSet<>();

        for (RecentlyStudied r : recent) {
            recentIds.add(r.getLibraryItemId());
            libraryItemRepository.findById(r.getLibraryItemId()).ifPresent(item -> {
                recentTitles.add(item.getTitle());
                if (item instanceof FlashcardSet fs) {
                    if (fs.getCourse() != null) recentCourses.add(fs.getCourse());
                    if (fs.getUniversity() != null) recentUniversities.add(fs.getUniversity());
                }
            });
        }

        // Find all public flashcard sets not already studied
        List<LibraryItem> candidates = libraryItemRepository.findAll().stream()
                .filter(item -> item.isPublic())
                .filter(item -> !recentIds.contains(item.getId()))
                .filter(item -> item instanceof FlashcardSet)
                .collect(Collectors.toList());

        if (candidates.isEmpty()) return Optional.empty();

        // Score each candidate
        FlashcardSet best = null;
        int bestScore = -1;
        String bestReason = null;
        String triggerTitle = null;

        for (LibraryItem candidate : candidates) {
            FlashcardSet fs = (FlashcardSet) candidate;
            int score = 0;
            String reason = null;
            String trigger = null;

            if (fs.getCourse() != null && recentCourses.contains(fs.getCourse())) {
                score += 3;
                reason = "Because you recently studied " + fs.getCourse() + " material";
                // Find which recent item triggered this
                trigger = recentTitles.isEmpty() ? null : recentTitles.get(0);
            }
            if (fs.getUniversity() != null && recentUniversities.contains(fs.getUniversity())) {
                score += 2;
                if (reason == null) {
                    reason = "Because you study at " + fs.getUniversity();
                    trigger = recentTitles.isEmpty() ? null : recentTitles.get(0);
                }
            }
            // Keyword match on title
            for (String title : recentTitles) {
                String[] words = title.toLowerCase().split("\\s+");
                for (String word : words) {
                    if (word.length() > 3 && fs.getTitle().toLowerCase().contains(word)) {
                        score += 1;
                        if (reason == null) {
                            reason = "Because you recently studied \"" + title + "\"";
                            trigger = title;
                        }
                        break;
                    }
                }
            }

            if (score > bestScore) {
                bestScore = score;
                best = fs;
                bestReason = reason;
                triggerTitle = trigger;
            }
        }

        if (best == null || bestScore == 0) return Optional.empty();

        Map<String, Object> result = new HashMap<>();
        result.put("setId", best.getId());
        result.put("title", best.getTitle());
        result.put("course", best.getCourse());
        result.put("university", best.getUniversity());
        result.put("cardCount", best.getFlashcards().size());
        result.put("reason", bestReason != null ? bestReason : "We think you might like this");
        return Optional.of(result);
    }
}