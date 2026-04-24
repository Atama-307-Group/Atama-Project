package com.atama.dto.game;

import com.atama.model.game.GameState;
import com.atama.model.game.Player;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GameStateResponse {
    private String joinCode;
    private GameState state;
    private UUID hostId;
    private List<Player> players;
    private QuestionPayload currentQuestion;
}
