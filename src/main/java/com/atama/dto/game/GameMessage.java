package com.atama.dto.game;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GameMessage {
    private String type; // e.g., "PLAYER_JOINED", "GAME_STARTED", "QUESTION_ACTIVE", "QUESTION_ENDED", "FINISH"
    private Object payload;
}
