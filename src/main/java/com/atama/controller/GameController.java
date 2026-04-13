package com.atama.controller;

import com.atama.dto.game.HostGameRequest;
import com.atama.dto.game.HostGameResponse;
import com.atama.model.game.GameSession;
import com.atama.service.GameService;
import com.atama.service.JwtService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/games")
public class GameController {

    private final GameService gameService;
    private final JwtService jwtService;

    public GameController(GameService gameService, JwtService jwtService) {
        this.gameService = gameService;
        this.jwtService = jwtService;
    }

    @PostMapping("/host")
    public ResponseEntity<HostGameResponse> hostGame(
            org.springframework.security.core.Authentication authentication,
            @RequestBody HostGameRequest request) {

        if (authentication == null || "anonymousUser".equals(authentication.getPrincipal())) {
            return ResponseEntity.status(401).build();
        }

        UUID userId = UUID.fromString(authentication.getName());

        GameSession session = gameService.hostGame(userId, UUID.fromString(request.getFlashcardSetId()));
        return ResponseEntity.ok(new HostGameResponse(session.getJoinCode()));
    }

    @GetMapping("/{joinCode}/validate")
    public ResponseEntity<?> validateGame(@PathVariable("joinCode") String joinCode) {
        // Will throw 404 if not found
        GameSession session = gameService.getGame(joinCode);
        return ResponseEntity.ok(session.getState());
    }

    @GetMapping("/{joinCode}/state")
    public ResponseEntity<com.atama.dto.game.GameStateResponse> getGameState(@PathVariable("joinCode") String joinCode) {
        GameSession session = gameService.getGame(joinCode);
        com.atama.dto.game.GameStateResponse response = new com.atama.dto.game.GameStateResponse(
                session.getJoinCode(),
                session.getState(),
                session.getHostId(),
                session.getPlayers(),
                session.getCurrentQuestionPayload()
        );
        return ResponseEntity.ok(response);
    }
}
