package com.atama.model;

import java.util.List;

public class FillBlankFlashcard implements Flashcard {
    private int id;
    private String textWithBlanks;
    private List<String> correctAnswers;

    public FillBlankFlashcard() {}

    public FillBlankFlashcard(int id, String textWithBlanks, List<String> correctAnswers) {
        this.id = id;
        this.textWithBlanks = textWithBlanks;
        this.correctAnswers = correctAnswers;
    }

    @Override
    public int getId() {
        return id;
    }

    @Override
    public void setId(int id) {
        this.id = id;
    }

    public String getTextWithBlanks() {
        return textWithBlanks;
    }

    public void setTextWithBlanks(String textWithBlanks) {
        this.textWithBlanks = textWithBlanks;
    }

    public List<String> getCorrectAnswers() {
        return correctAnswers;
    }

    public void setCorrectAnswers(List<String> correctAnswers) {
        this.correctAnswers = correctAnswers;
    }
}
