package com.atama.dto.game;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class QuestionPayload {
    private String questionText;
    private List<String> options;
    private int questionIndex;
    private int totalQuestions;
}
