package com.atama.model.game;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class Player {
    private String participantId; // user ID or guest UUID
    private String nickname;
    private int score;
    private boolean answeredCurrentQuestion;
    private boolean lastAnswerCorrect;

    public Player(String participantId, String nickname) {
        this.participantId = participantId;
        this.nickname = nickname;
        this.score = 0;
        this.answeredCurrentQuestion = false;
        this.lastAnswerCorrect = false;
    }
}
