package com.atama.service;

import com.atama.dto.game.QuestionDTO;
import com.atama.dto.request.PracticeTestRequest;
import com.atama.model.FillBlankFlashcard;
import com.atama.model.Flashcard;
import com.atama.model.FlashcardSet;
import com.atama.model.NormalFlashcard;
import com.atama.model.PDF;
import com.atama.repository.FlashcardSetRepository;
import com.atama.repository.PDFRepository;
import org.springframework.stereotype.Service;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class PracticeTestService {

    private final GeminiService geminiService;
    private final FlashcardSetRepository flashcardSetRepository;
    private final PDFRepository pdfRepository;

    public PracticeTestService(GeminiService geminiService, FlashcardSetRepository flashcardSetRepository, PDFRepository pdfRepository) {
        this.geminiService = geminiService;
        this.flashcardSetRepository = flashcardSetRepository;
        this.pdfRepository = pdfRepository;
    }

    public List<QuestionDTO> generatePracticeTest(PracticeTestRequest request) {
        StringBuilder combinedText = new StringBuilder();

        // 1. Get content from Flashcard Sets
        List<Flashcard> allCards = new ArrayList<>();
        if (request.getFlashcardSetIds() != null) {
            for (UUID setId : request.getFlashcardSetIds()) {
                Optional<FlashcardSet> optSet = flashcardSetRepository.findById(setId);
                if (optSet.isPresent()) {
                    for (Flashcard card : optSet.get().getFlashcards()) {
                        allCards.add(card);
                        if (card instanceof NormalFlashcard) {
                            NormalFlashcard nf = (NormalFlashcard) card;
                            combinedText.append(nf.getTerm()).append(": ").append(nf.getDefinition()).append("\n");
                        } else if (card instanceof FillBlankFlashcard) {
                            FillBlankFlashcard fbf = (FillBlankFlashcard) card;
                            combinedText.append(fbf.getTextWithBlanks()).append(" -> Correct: ").append(String.join(", ", fbf.getCorrectAnswers())).append("\n");
                        }
                    }
                }
            }
        }

        // 2. Get content from PDFs
        if (request.getDocumentIds() != null) {
            for (UUID docId : request.getDocumentIds()) {
                Optional<PDF> optPdf = pdfRepository.findById(docId);
                if (optPdf.isPresent()) {
                    PDF pdf = optPdf.get();
                    try {
                        Path path = Paths.get(pdf.getFilePath());
                        if (Files.exists(path)) {
                            try (PDDocument document = Loader.loadPDF(Files.readAllBytes(path))) {
                                PDFTextStripper stripper = new PDFTextStripper();
                                String text = stripper.getText(document);
                                if (text != null && !text.trim().isEmpty()) {
                                    combinedText.append("\n").append(text).append("\n");
                                }
                            }
                        } else {
                            throw new RuntimeException("PDF file not found on server for document ID: " + docId);
                        }
                    } catch (IOException e) {
                        throw new RuntimeException("Failed to read PDF file for document ID: " + docId, e);
                    }
                } else {
                    throw new RuntimeException("PDF record not found in database for document ID: " + docId);
                }
            }
        }
        // 3. Formatted text
        if (request.getFormattedText() != null && !request.getFormattedText().trim().isEmpty()) {
            combinedText.append("\n").append(request.getFormattedText());
            // parse manual text to add to local allCards if AI is disabled
            if (!request.isUseAi()) {
                String[] lines = request.getFormattedText().split("\n");
                for (String line : lines) {
                    if (line.contains(":")) {
                        String[] parts = line.split(":", 2);
                        NormalFlashcard nf = new NormalFlashcard();
                        nf.setTerm(parts[0].trim());
                        nf.setDefinition(parts[1].trim());
                        allCards.add(nf);
                    }
                }
            }
        }

        int numQuestions = request.getNumQuestions() > 0 ? request.getNumQuestions() : 10;
        List<String> types = request.getQuestionTypes() != null && !request.getQuestionTypes().isEmpty() ? 
                request.getQuestionTypes() : List.of("MCQ");

        if (request.isUseAi()) {
            if (combinedText.toString().trim().isEmpty()) {
                throw new RuntimeException("No valid text found in the selected materials. Please ensure your PDFs contain readable text or you have selected non-empty flashcard sets.");
            }
            return geminiService.generatePracticeTestFromText(combinedText.toString(), types, numQuestions);
        } else {
            return generateQuestionsLocally(allCards, types, numQuestions);
        }
    }

    private List<QuestionDTO> generateQuestionsLocally(List<Flashcard> cards, List<String> types, int limit) {
        List<QuestionDTO> questions = new ArrayList<>();
        if (cards == null || cards.isEmpty()) return questions;

        List<Flashcard> shuffledCards = new ArrayList<>(cards);
        Collections.shuffle(shuffledCards);

        for (int i = 0; i < Math.min(limit, shuffledCards.size()); i++) {
            Flashcard card = shuffledCards.get(i);
            String qType = types.get((int) (Math.random() * types.size())); // random selected type

            QuestionDTO q = new QuestionDTO();
            if (card instanceof FillBlankFlashcard) {
                FillBlankFlashcard fbf = (FillBlankFlashcard) card;
                q.setType("FITB"); 
                q.setPrompt(fbf.getTextWithBlanks());
                q.setCorrectAnswers(fbf.getCorrectAnswers());
            } else if (card instanceof NormalFlashcard) {
                NormalFlashcard nf = (NormalFlashcard) card;
                if (qType.equalsIgnoreCase("TRUE_FALSE")) {
                    q.setType("TRUE_FALSE");
                    boolean isTrue = Math.random() > 0.5;
                    List<NormalFlashcard> otherNfs = cards.stream()
                        .filter(c -> c instanceof NormalFlashcard && c != card)
                        .map(c -> (NormalFlashcard) c)
                        .collect(Collectors.toList());

                    if (isTrue || otherNfs.isEmpty()) {
                        q.setPrompt(nf.getTerm() + " is " + nf.getDefinition() + ".");
                        q.setCorrectAnswer("True");
                    } else {
                        NormalFlashcard randomOther = otherNfs.get((int) (Math.random() * otherNfs.size()));
                        q.setPrompt(nf.getTerm() + " is " + randomOther.getDefinition() + ".");
                        q.setCorrectAnswer("False");
                    }
                    q.setChoices(List.of("True", "False"));
                } else if (qType.equalsIgnoreCase("SHORT_ANSWER")) {
                    q.setType("SHORT_ANSWER");
                    q.setPrompt("What is the definition of " + nf.getTerm() + "?");
                    q.setCorrectAnswers(List.of(nf.getDefinition()));
                } else { // MCQ
                    q.setType("MCQ");
                    q.setPrompt(nf.getTerm());
                    q.setCorrectAnswer(nf.getDefinition());
                    
                    List<String> choices = new ArrayList<>();
                    choices.add(nf.getDefinition());
                    
                    List<NormalFlashcard> others = cards.stream()
                        .filter(c -> c instanceof NormalFlashcard && c != card)
                        .map(c -> (NormalFlashcard) c)
                        .collect(Collectors.toList());
                    Collections.shuffle(others);
                    for (int j = 0; j < Math.min(3, others.size()); j++) {
                        choices.add(others.get(j).getDefinition());
                    }
                    Collections.shuffle(choices);
                    q.setChoices(choices);
                }
            }
            questions.add(q);
        }
        return questions;
    }
}
