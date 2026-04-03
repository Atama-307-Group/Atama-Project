package com.atama.dto.response;

import com.atama.model.ReviewTag;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class ReviewDTO {
    private UUID id;
    private UUID userId;
    private int stars;
    private List<ReviewTag> tags;
    private Instant createdAt;
    private Instant updatedAt;
}