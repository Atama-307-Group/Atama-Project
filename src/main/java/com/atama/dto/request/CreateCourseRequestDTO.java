package com.atama.dto.request;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
public class CreateCourseRequestDTO {
    private UUID universityId;
    private UUID userId;
    private String code;
    private String name;
}