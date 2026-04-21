package com.atama.dto.game;

import com.atama.model.game.Player;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class QuestionEndedPayload {
    private List<Player> players;
    private String correctAnswer;
}
