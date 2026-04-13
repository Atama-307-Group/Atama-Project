package com.atama.service;

import com.atama.model.game.Player;
import com.atama.dto.game.QuestionPayload;
import com.atama.dto.response.FlashcardResponseDTO;
import com.atama.dto.response.NormalFlashcardResponseDTO;
import com.atama.exception.ResourceNotFoundException;
import com.atama.model.game.GameSession;
import com.atama.model.game.GameState;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class GameService {

    private final FlashcardSetService flashcardSetService;

    // In-memory store for active games (join code -> GameSession)
    private final Map<String, GameSession> activeGames = new ConcurrentHashMap<>();
    private final Random random = new Random();

    public GameSession hostGame(UUID userId, UUID flashcardSetId) {
        List<FlashcardResponseDTO> set = flashcardSetService.getFlashcardsBySetId(flashcardSetId);
        if (set == null || set.isEmpty()) {
            throw new IllegalArgumentException("Cannot host a game with an empty flashcard set.");
        }

        String joinCode = generateJoinCode();
        GameSession game = new GameSession(joinCode, userId, set);
        activeGames.put(joinCode, game);
        return game;
    }

    public GameSession getGame(String joinCode) {
        GameSession game = activeGames.get(joinCode);
        if (game == null) {
            throw new ResourceNotFoundException("Game", "joinCode", joinCode);
        }
        return game;
    }

    public Player joinGame(String joinCode, String nickname, String participantId) {
        GameSession game = getGame(joinCode);
        if (game.getState() != GameState.LOBBY) {
            throw new IllegalStateException("Game is already in progress.");
        }

        Player player = new Player(participantId, nickname);
        game.addPlayer(player);
        return player;
    }

    public QuestionPayload nextQuestion(String joinCode) {
        GameSession game = getGame(joinCode);
        game.setCurrentQuestionIndex(game.getCurrentQuestionIndex() + 1);

        if (game.getCurrentQuestionIndex() >= game.getFlashcards().size()) {
            game.setState(GameState.FINISHED);
            return null; // Game Over
        }

        game.setState(GameState.QUESTION_ACTIVE);

        // Reset players answered state
        for (Player p : game.getPlayers()) {
            p.setAnsweredCurrentQuestion(false);
        }

        FlashcardResponseDTO currentFc = game.getFlashcards().get(game.getCurrentQuestionIndex());

        // We synthesize options. If it's normal, we get other definitions.
        String questionText = "Question";
        List<String> options = new ArrayList<>();
        
        if (currentFc instanceof NormalFlashcardResponseDTO normalFc) {
            questionText = normalFc.getTerm();
            options.add(normalFc.getDefinition()); // correct answer

            // Synthesize false answers
            List<String> allDefs = new ArrayList<>();
            for (FlashcardResponseDTO fc : game.getFlashcards()) {
                 if (fc instanceof NormalFlashcardResponseDTO nfc && !nfc.getId().equals(normalFc.getId())) {
                     allDefs.add(nfc.getDefinition());
                 }
            }

            Collections.shuffle(allDefs);
            int wrongsToAdd = Math.min(3, allDefs.size());
            for (int i = 0; i < wrongsToAdd; i++) {
                options.add(allDefs.get(i));
            }

            // Fill with generic if still < 4
            while (options.size() < 4) {
                options.add("Fake Answer " + random.nextInt(100)); // fallback
            }
        } else {
             // For drag drop/fill blank, we might just be broad
             questionText = "Special Flashcard. Select any option.";
             options.addAll(Arrays.asList("A", "B", "C", "D"));
        }

        Collections.shuffle(options);
        QuestionPayload payload = new QuestionPayload(questionText, options, game.getCurrentQuestionIndex() + 1, game.getFlashcards().size());
        game.setCurrentQuestionPayload(payload);
        return payload;
    }

    public void submitAnswer(String joinCode, String participantId, String selectedOptionText) {
        GameSession game = getGame(joinCode);
        Player player = game.getPlayer(participantId);
        
        if (player != null && !player.isAnsweredCurrentQuestion()) {
            player.setAnsweredCurrentQuestion(true);
            
            boolean isCorrect = false;
            FlashcardResponseDTO currentFc = game.getFlashcards().get(game.getCurrentQuestionIndex());
            if (currentFc instanceof NormalFlashcardResponseDTO normalFc) {
                if (normalFc.getDefinition().equals(selectedOptionText)) {
                    isCorrect = true;
                }
            } else {
                // If special type, anything is considered correct for MVP
                isCorrect = true;
            }
            
            player.setLastAnswerCorrect(isCorrect);
            if (isCorrect) {
                player.setScore(player.getScore() + 1000);
            }
        }
    }

    public void endQuestion(String joinCode) {
        GameSession game = getGame(joinCode);
        game.setState(GameState.QUESTION_ENDED);
    }

    public void finishGame(String joinCode) {
        GameSession game = activeGames.get(joinCode);
        if(game != null) {
             game.setState(GameState.FINISHED);
        }
    }

    private String generateJoinCode() {
        String code;
        do {
            code = String.format("%06d", random.nextInt(1000000));
        } while (activeGames.containsKey(code));
        return code;
    }
}
