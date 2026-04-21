package com.atama.dto.game;

import lombok.Data;

@Data
public class AnswerSubmission {
    private String joinCode;
    private String participantId;
    private String selectedOptionText;
}
