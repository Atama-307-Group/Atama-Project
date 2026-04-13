import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../../context/GameContext';
import './game.css';

function ParticipantPlayView({ currentUser }) {
    const { joinCode } = useParams();
    const navigate = useNavigate();
    const { 
        connected, gameState, currentQuestion, 
        connectToGame, submitAnswer, disconnect, players, participantId 
    } = useGame();
    
    const [selectedOptionIndex, setSelectedOptionIndex] = useState(null);

    useEffect(() => {
        if (!currentUser) {
            alert("Must be logged in.");
            navigate('/login');
            return;
        }

        if (!connected) {
            connectToGame(joinCode, currentUser.username, currentUser.id);
        }

        return () => {
            // we don't disconnect on unmount so they survive re-renders, 
            // but we might want them to disconnect when leaving the page entirely.
        };
    }, []);

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

    if (gameState === 'LOBBY') {
        return (
            <div className="game-container game-bg-join centered">
                <h2>You're in!</h2>
                <p>See your nickname on screen.</p>
                <div className="player-badge large">{currentUser?.username}</div>
            </div>
        );
    }

    if (gameState === 'QUESTION_STARTING') {
        return (
            <div className="game-container game-bg-join centered">
                <h1 className="countdown-text">Loading...</h1>
            </div>
        );
    }

    if (gameState === 'QUESTION_ACTIVE') {
        if (selectedOptionIndex !== null) {
            return (
                <div className="game-container game-bg-join centered">
                    <h2>Waiting for others...</h2>
                </div>
            );
        }

        return (
            <div className="game-container game-bg-join flex-col">
                <div className="participant-question-display">
                    <h2>Question {currentQuestion?.questionIndex} of {currentQuestion?.totalQuestions}</h2>
                    <h1>{currentQuestion?.questionText}</h1>
                </div>
                <div className="participant-options-grid">
                    {currentQuestion?.options.map((opt, idx) => (
                        <div 
                            key={idx} 
                            className={`option-card shape-${idx} clickable`}
                            onClick={() => handleAnswerClick(idx, opt)}
                        >
                            <span className="option-shape"></span>
                            <span className="option-text">{opt}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (gameState === 'QUESTION_ENDED') {
        const me = players.find(p => String(p.participantId) === String(participantId));
        return (
            <div className="game-container game-bg-join centered">
                {me?.lastAnswerCorrect ? <h1 style={{color: '#4CAF50'}}>Correct!</h1> : <h1 style={{color: '#f44336'}}>Submitted / Incorrect</h1>}
                <div className="score-badge">Score: {me?.score || 0}</div>
                <p>Waiting for next question...</p>
            </div>
        );
    }

    if (gameState === 'FINISHED') {
        const me = players.find(p => String(p.participantId) === String(participantId));
        const rank = [...players].sort((a,b) => b.score - a.score).findIndex(p => String(p.participantId) === String(participantId)) + 1;
        
        return (
            <div className="game-container game-bg-join flex-col centered">
                <h1>Game Over</h1>
                <h2>You placed #{rank}!</h2>
                <div className="score-badge">Final Score: {me?.score || 0}</div>
                <button className="game-btn primary" onClick={() => { disconnect(); navigate('/'); }} style={{marginTop: '40px'}}>Back Home</button>
            </div>
        );
    }

    return <div>Loading...</div>;
}

export default ParticipantPlayView;
