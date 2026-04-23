package com.atama.dto.request;

import java.util.List;
import java.util.UUID;

public class PracticeTestRequest {
    private List<UUID> flashcardSetIds;
    private List<UUID> documentIds;
    private String formattedText;
    private boolean useAi;
    private List<String> questionTypes;
    private int numQuestions; // optional

    // Getters and setters
    public List<UUID> getFlashcardSetIds() { return flashcardSetIds; }
    public void setFlashcardSetIds(List<UUID> flashcardSetIds) { this.flashcardSetIds = flashcardSetIds; }

    public List<UUID> getDocumentIds() { return documentIds; }
    public void setDocumentIds(List<UUID> documentIds) { this.documentIds = documentIds; }

    public String getFormattedText() { return formattedText; }
    public void setFormattedText(String formattedText) { this.formattedText = formattedText; }

    public boolean isUseAi() { return useAi; }
    public void setUseAi(boolean useAi) { this.useAi = useAi; }

    public List<String> getQuestionTypes() { return questionTypes; }
    public void setQuestionTypes(List<String> questionTypes) { this.questionTypes = questionTypes; }

    public int getNumQuestions() { return numQuestions; }
    public void setNumQuestions(int numQuestions) { this.numQuestions = numQuestions; }
}
