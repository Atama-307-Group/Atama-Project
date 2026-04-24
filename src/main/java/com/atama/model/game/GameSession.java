package com.atama.model.game;

import com.atama.dto.response.FlashcardResponseDTO;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
@NoArgsConstructor
public class GameSession {
    private String joinCode;
    private UUID hostId;
    private List<FlashcardResponseDTO> flashcards = new ArrayList<>();
    private List<Player> players = new ArrayList<>();
    private GameState state = GameState.LOBBY;
    private int currentQuestionIndex = -1;
    private com.atama.dto.game.QuestionPayload currentQuestionPayload = null;
    
    // Mapping participantId -> Player
    private Map<String, Player> playerMap = new HashMap<>();

    public GameSession(String joinCode, UUID hostId, List<FlashcardResponseDTO> flashcards) {
        this.joinCode = joinCode;
        this.hostId = hostId;
        this.flashcards = flashcards;
    }

    public synchronized void addPlayer(Player player) {
        if (!playerMap.containsKey(player.getParticipantId())) {
            players.add(player);
            playerMap.put(player.getParticipantId(), player);
        }
    }

    public synchronized Player getPlayer(String participantId) {
        return playerMap.get(participantId);
    }
}
