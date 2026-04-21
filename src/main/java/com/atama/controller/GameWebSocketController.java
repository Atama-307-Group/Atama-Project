package com.atama.controller;

import com.atama.dto.game.*;
import com.atama.model.game.Player;
import com.atama.model.game.GameSession;
import com.atama.service.GameService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.Map;

@Controller
@RequiredArgsConstructor
public class GameWebSocketController {

    private final GameService gameService;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/game.join")
    public void joinGame(@Payload GameJoinRequest request) {
        Player player = gameService.joinGame(request.getJoinCode(), request.getNickname(), request.getParticipantId());
        GameSession session = gameService.getGame(request.getJoinCode());
        
        // Broadcast new player list to everyone in this game's topic
        messagingTemplate.convertAndSend("/topic/game/" + request.getJoinCode(), 
            new GameMessage("UPDATE_PLAYERS", session.getPlayers()));
    }

    @MessageMapping("/game.start")
    public void startGame(@Payload Map<String, String> payload) {
        String joinCode = payload.get("joinCode");
        QuestionPayload nextQ = gameService.nextQuestion(joinCode);
        
        GameMessage msg = new GameMessage("QUESTION_STARTING", null); // triggers frontend animation
        messagingTemplate.convertAndSend("/topic/game/" + joinCode, msg);
        
        // Let's send the question immediately after, the frontend can handle the countdown locally
        new Thread(() -> {
            try {
                Thread.sleep(3000); // 3 sec countdown before active
                messagingTemplate.convertAndSend("/topic/game/" + joinCode, 
                    new GameMessage("QUESTION_ACTIVE", nextQ));
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }).start();
    }

    @MessageMapping("/game.submitAnswer")
    public void submitAnswer(@Payload AnswerSubmission payload) {
        gameService.submitAnswer(payload.getJoinCode(), payload.getParticipantId(), payload.getSelectedOptionText());
        
        GameSession session = gameService.getGame(payload.getJoinCode());
        boolean allAnswered = session.getPlayers().stream().allMatch(Player::isAnsweredCurrentQuestion);
        
        if (allAnswered && session.getState() == com.atama.model.game.GameState.QUESTION_ACTIVE) {
            gameService.endQuestion(payload.getJoinCode());
            String correctAnswer = session.getCurrentQuestionPayload() != null
                ? session.getCurrentQuestionPayload().getCorrectAnswer() : "";
            messagingTemplate.convertAndSend("/topic/game/" + payload.getJoinCode(),
                new GameMessage("QUESTION_ENDED", new QuestionEndedPayload(session.getPlayers(), correctAnswer)));
        } else {
            // Broadcast so host sees the "X / Y Answers" counter update dynamically
            messagingTemplate.convertAndSend("/topic/game/" + payload.getJoinCode(), 
                new GameMessage("UPDATE_PLAYERS", session.getPlayers()));
        }
    }

    @MessageMapping("/game.endQuestion")
    public void endQuestion(@Payload Map<String, String> payload) {
        String joinCode = payload.get("joinCode");
        gameService.endQuestion(joinCode);
        GameSession session = gameService.getGame(joinCode);
        String correctAnswer = session.getCurrentQuestionPayload() != null
            ? session.getCurrentQuestionPayload().getCorrectAnswer() : "";
        messagingTemplate.convertAndSend("/topic/game/" + joinCode,
            new GameMessage("QUESTION_ENDED", new QuestionEndedPayload(session.getPlayers(), correctAnswer)));
    }
    
    @MessageMapping("/game.nextQuestion")
    public void nextQuestion(@Payload Map<String, String> payload) {
        String joinCode = payload.get("joinCode");
        QuestionPayload nextQ = gameService.nextQuestion(joinCode);
        
        if (nextQ == null) {
            GameSession session = gameService.getGame(joinCode);
            messagingTemplate.convertAndSend("/topic/game/" + joinCode, 
                new GameMessage("FINISHED", session.getPlayers()));
        } else {
             messagingTemplate.convertAndSend("/topic/game/" + joinCode, 
                    new GameMessage("QUESTION_ACTIVE", nextQ));
        }
    }

    @MessageMapping("/game.endGame")
    public void endGame(@Payload Map<String, String> payload) {
        String joinCode = payload.get("joinCode");
        gameService.finishGame(joinCode);
        GameSession session = gameService.getGame(joinCode);
        messagingTemplate.convertAndSend("/topic/game/" + joinCode,
            new GameMessage("FINISHED", session.getPlayers()));
    }
}
