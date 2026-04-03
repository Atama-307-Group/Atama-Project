package com.atama.service;

import com.atama.dto.response.ReviewDTO;
import com.atama.exception.ResourceNotFoundException;
import com.atama.model.FlashcardSet;
import com.atama.model.FlashcardSetReview;
import com.atama.model.ReviewTag;
import com.atama.repository.FlashcardSetRepository;
import com.atama.repository.FlashcardSetReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class FlashcardSetReviewService {

    private final FlashcardSetReviewRepository reviewRepository;
    private final FlashcardSetRepository flashcardSetRepository;

    /** Get the current user's review for a set, or empty if none. */
    @Transactional(readOnly = true)
    public Optional<ReviewDTO> getMyReview(UUID userId, UUID setId) {
        return reviewRepository.findByUserIdAndFlashcardSet_Id(userId, setId)
                .map(this::toDTO);
    }

    /** Create or update the current user's review. */
    public ReviewDTO upsertReview(UUID userId, UUID setId, int stars, List<ReviewTag> tags) {
        if (stars < 1 || stars > 5) throw new IllegalArgumentException("Stars must be between 1 and 5.");
        if (tags != null && tags.size() > 3) throw new IllegalArgumentException("Maximum 3 tags allowed.");

        FlashcardSet set = flashcardSetRepository.findById(setId)
                .orElseThrow(() -> new ResourceNotFoundException("FlashcardSet", "id", setId));

        if (set.getOwnerId().equals(userId)) {
            throw new IllegalArgumentException("You cannot review your own flashcard set.");
        }

        FlashcardSetReview review = reviewRepository
                .findByUserIdAndFlashcardSet_Id(userId, setId)
                .orElseGet(() -> {
                    FlashcardSetReview r = new FlashcardSetReview();
                    r.setUserId(userId);
                    r.setFlashcardSet(set);
                    return r;
                });

        review.setStars(stars);
        review.setTags(tags != null ? tags : new ArrayList<>());
        return toDTO(reviewRepository.save(review));
    }

    /** Delete the current user's review. */
    public void deleteReview(UUID userId, UUID setId) {
        FlashcardSetReview review = reviewRepository
                .findByUserIdAndFlashcardSet_Id(userId, setId)
                .orElseThrow(() -> new ResourceNotFoundException("Review", "user+set", setId));
        reviewRepository.delete(review);
    }

    /** Aggregate stats: average stars and top 3 most used tags. */
    @Transactional(readOnly = true)
    public ReviewAggregate getAggregate(UUID setId) {
        List<FlashcardSetReview> reviews = reviewRepository.findByFlashcardSet_Id(setId);

        if (reviews.isEmpty()) return new ReviewAggregate(null, List.of(), 0);

        double avg = reviews.stream()
                .mapToInt(FlashcardSetReview::getStars)
                .average()
                .orElse(0);

        // Count tag frequency
        Map<ReviewTag, Long> tagCounts = reviews.stream()
                .flatMap(r -> r.getTags().stream())
                .collect(Collectors.groupingBy(t -> t, Collectors.counting()));

        List<ReviewTag> topTags = tagCounts.entrySet().stream()
                .sorted(Map.Entry.<ReviewTag, Long>comparingByValue().reversed())
                .limit(3)
                .map(Map.Entry::getKey)
                .toList();

        // Round to 1 decimal place
        double rounded = Math.round(avg * 10.0) / 10.0;
        return new ReviewAggregate(rounded, topTags, reviews.size());
    }

    private ReviewDTO toDTO(FlashcardSetReview r) {
        return new ReviewDTO(r.getId(), r.getUserId(), r.getStars(), r.getTags(), r.getCreatedAt(), r.getUpdatedAt());
    }

    public record ReviewAggregate(Double averageStars, List<ReviewTag> topTags, int reviewCount) {}
}