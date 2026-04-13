import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../../context/GameContext';
import './game.css'; // We'll create this later

function HostGameView({ currentUser }) {
    const { joinCode } = useParams();
    const navigate = useNavigate();
    const { 
        connected, gameState, players, currentQuestion, participantId, submitAnswer,
        connectToGame, startGame, nextQuestion, endQuestion, disconnect 
    } = useGame();

    const [selectedOptionIndex, setSelectedOptionIndex] = useState(null);

    // Reset selection when new question arrives
    useEffect(() => {
        if (gameState === 'QUESTION_ACTIVE') {
            setSelectedOptionIndex(null);
        }
    }, [gameState]);

    const handleAnswerClick = (index, optText) => {
        if (selectedOptionIndex !== null) return; // already answered
        setSelectedOptionIndex(index);
        
        submitAnswer(optText);
    };

    useEffect(() => {
        if (!connected) {
            connectToGame(joinCode, currentUser.username, currentUser.id);
        }
        return () => {
            // Optional: disconnect on unmount, but might not want this if they refresh
            // For now, we'll let context handle it or explicitly keep alive.
        };
    }, []);

    const handleCopyLink = () => {
        const link = `${window.location.origin}/game/join/${joinCode}`;
        navigator.clipboard.writeText(link);
        alert('Invitation link copied to clipboard!');
    };

    if (gameState === 'LOBBY') {
        return (
            <div className="game-container game-bg-host">
                <div className="host-lobby-header">
                    <h1>Join at <span className="highlight-url">{window.location.origin}/game/join</span></h1>
                    <div className="join-code-huge">
                        PIN: {joinCode}
                    </div>
                </div>
                
                <div className="host-lobby-controls">
                    <button className="game-btn primary" onClick={handleCopyLink}>Copy Join Link</button>
                    <button className="game-btn secondary" onClick={startGame} disabled={players.length === 0}>
                        Start Game ({players.length} Players)
                    </button>
                </div>

                <div className="players-grid">
                    {players.map((p, idx) => (
                        <div key={idx} className="player-badge">
                            {p.nickname}
                        </div>
                    ))}
                    {players.length === 0 && <p style={{color: 'white', fontSize: '20px', marginTop: '40px'}}>Waiting for players...</p>}
                </div>
            </div>
        );
    }

    if (gameState === 'QUESTION_STARTING') {
        return (
            <div className="game-container game-bg-host centered">
                <h1 className="countdown-text">Get Ready...</h1>
            </div>
        );
    }

    if (gameState === 'QUESTION_ACTIVE') {
        return (
            <div className="game-container game-bg-host flex-col">
                <div className="host-question-display">
                    <h2>Question {currentQuestion?.questionIndex} of {currentQuestion?.totalQuestions}</h2>
                    <h1>{currentQuestion?.questionText}</h1>
                </div>
                
                <div className="host-options-grid">
                    {currentQuestion?.options.map((opt, idx) => {
                        const isSelected = selectedOptionIndex === idx;
                        const opacityStyle = selectedOptionIndex !== null && !isSelected ? { opacity: 0.5 } : {};
                        return (
                            <div 
                                key={idx} 
                                className={`option-card shape-${idx} ${selectedOptionIndex === null ? 'clickable' : ''}`}
                                onClick={() => handleAnswerClick(idx, opt)}
                                style={opacityStyle}
                            >
                                <span className="option-shape"></span>
                                <span className="option-text">{opt}</span>
                            </div>
                        );
                    })}
                </div>

                <div className="host-footer">
                    <p>{players.filter(p => p.answeredCurrentQuestion).length} / {players.length} Answers</p>
                    <button className="game-btn secondary" onClick={endQuestion}>Skip / Show Answer</button>
                </div>
            </div>
        );
    }

    if (gameState === 'QUESTION_ENDED') {
        return (
            <div className="game-container game-bg-host flex-col centered">
                <h1>Round Ended</h1>
                <div className="leaderboard">
                    <h2>Leaderboard</h2>
                    {players.sort((a,b) => b.score - a.score).slice(0, 5).map((p, idx) => (
                        <div key={idx} className="leaderboard-row">
                            <span>#{idx + 1} {p.nickname}</span>
                            <span>{p.score} pts</span>
                        </div>
                    ))}
                </div>
                <button className="game-btn primary" onClick={nextQuestion} style={{marginTop: '40px'}}>Next Question</button>
            </div>
        );
    }

    if (gameState === 'FINISHED') {
        const sorted = [...players].sort((a,b) => b.score - a.score);
        return (
            <div className="game-container game-bg-host flex-col centered podium-view">
                <h1>Podium</h1>
                {sorted[1] && <div className="podium-place place-2">2nd<br/>{sorted[1].nickname}</div>}
                {sorted[0] && <div className="podium-place place-1">1st<br/>{sorted[0].nickname}</div>}
                {sorted[2] && <div className="podium-place place-3">3rd<br/>{sorted[2].nickname}</div>}
                
                <button className="game-btn primary" onClick={() => navigate('/')} style={{marginTop: '40px'}}>Exit</button>
            </div>
        );
    }

    return <div>Loading...</div>;
}

export default HostGameView;
