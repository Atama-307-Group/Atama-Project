package com.atama.dto.game;

import java.util.List;

public class QuestionDTO {
    private String type; // "MCQ", "TRUE_FALSE", "SHORT_ANSWER", "FITB"
    private String prompt;
    private String correctAnswer;
    private List<String> correctAnswers; // for short answer / FITB
    private List<String> choices; // for MCQ and True/False

    // Getters and setters
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getPrompt() { return prompt; }
    public void setPrompt(String prompt) { this.prompt = prompt; }

    public String getCorrectAnswer() { return correctAnswer; }
    public void setCorrectAnswer(String correctAnswer) { this.correctAnswer = correctAnswer; }

    public List<String> getCorrectAnswers() { return correctAnswers; }
    public void setCorrectAnswers(List<String> correctAnswers) { this.correctAnswers = correctAnswers; }

    public List<String> getChoices() { return choices; }
    public void setChoices(List<String> choices) { this.choices = choices; }
}
