import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../../context/GameContext';
import './game.css';

function ParticipantPlayView({ currentUser }) {
    const { joinCode } = useParams();
    const navigate = useNavigate();
    const { 
        connected, gameState, currentQuestion, correctAnswer,
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
        const wasCorrect = me?.lastAnswerCorrect;

        return (
            <div className="game-container game-bg-join flex-col">
                <div className="participant-question-display">
                    <p className="question-result-label" style={{
                        margin: 0,
                        fontSize: '13px',
                        fontWeight: 900,
                        letterSpacing: '0.07em',
                        textTransform: 'uppercase',
                        color: '#7a9e90',
                        marginBottom: '6px',
                    }}>
                        {wasCorrect ? '✓ Correct!' : '✗ Incorrect'}
                    </p>
                    <h1>{currentQuestion?.questionText}</h1>
                </div>

                <div className="participant-options-grid">
                    {currentQuestion?.options.map((opt, idx) => {
                        const isSelected = idx === selectedOptionIndex;
                        const isCorrectOpt = opt === correctAnswer;

                        let extraStyle = { opacity: 0.35, transform: 'scale(0.97)' };
                        if (isCorrectOpt) {
                            extraStyle = {
                                outline: '4px solid #1E352F',
                                outlineOffset: '2px',
                                opacity: 1,
                                transform: 'scale(1)',
                            };
                        }
                        if (isSelected) {
                            extraStyle = {
                                ...extraStyle,
                                opacity: 1,
                                transform: 'scale(1)',
                                outline: isCorrectOpt
                                    ? '4px solid #1E352F'
                                    : '4px solid rgba(255,255,255,0.6)',
                                outlineOffset: '2px',
                            };
                        }

                        return (
                            <div
                                key={idx}
                                className={`option-card shape-${idx}`}
                                style={extraStyle}
                            >
                                <span className="option-shape"></span>
                                <span className="option-text">
                                    {opt}
                                    {isSelected && !isCorrectOpt && ' ✗'}
                                    {isCorrectOpt && ' ✓'}
                                </span>
                            </div>
                        );
                    })}
                </div>

                <div style={{
                    padding: '16px 24px',
                    background: 'white',
                    borderTop: '1.5px solid rgba(51,81,69,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                }}>
                    <div>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#7a9e90', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Your score</p>
                        <p style={{ margin: 0, fontSize: 24, fontWeight: 950, color: '#1E352F' }}>{me?.score || 0} pts</p>
                    </div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#7a9e90' }}>Waiting for next question…</p>
                </div>
            </div>
        );
    }

    if (gameState === 'FINISHED') {
        const sorted = [...players].sort((a, b) => b.score - a.score);
        const me = sorted.find(p => String(p.participantId) === String(participantId));
        const rank = sorted.findIndex(p => String(p.participantId) === String(participantId)) + 1;
        const rankLabel = rank === 1 ? '1st' : rank === 2 ? '2nd' : rank === 3 ? '3rd' : `#${rank}`;
        const rankColor = rank === 1 ? '#e6a800' : rank === 2 ? '#868e96' : rank === 3 ? '#cd7f32' : '#2b5c3f';

        return (
            <div className="game-container game-bg-join flex-col centered" style={{ gap: 0, padding: '40px 24px' }}>
                <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 900, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#7a9e90' }}>Game Over</p>
                <h1 style={{ margin: '0 0 8px', fontSize: 36, fontWeight: 950, color: '#1E352F' }}>You finished</h1>

                <div style={{
                    fontSize: 72, fontWeight: 950, color: rankColor,
                    lineHeight: 1, marginBottom: 4,
                }}>
                    {rankLabel}
                </div>
                <div className="score-badge" style={{ marginBottom: 32 }}>
                    Final Score: {me?.score || 0} pts
                </div>

                {sorted.length > 0 && (
                    <div className="leaderboard" style={{ width: '100%', maxWidth: 400, marginBottom: 32 }}>
                        <h2>Top Players</h2>
                        {sorted.slice(0, 5).map((p, i) => (
                            <div key={i} className="leaderboard-row" style={{
                                background: String(p.participantId) === String(participantId)
                                    ? 'rgba(119,191,163,0.12)' : 'transparent',
                                borderRadius: 8, padding: '14px 8px',
                            }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <span style={{
                                        display: 'inline-flex', width: 26, height: 26,
                                        borderRadius: '50%', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 12, fontWeight: 900,
                                        background: i === 0 ? '#f5c518' : i === 1 ? '#adb5bd' : i === 2 ? '#cd7f32' : 'rgba(51,81,69,0.08)',
                                        color: i < 3 ? '#1a1000' : '#1E352F',
                                    }}>{i + 1}</span>
                                    {p.nickname}
                                    {String(p.participantId) === String(participantId) && (
                                        <span style={{ fontSize: 11, fontWeight: 700, color: '#2b5c3f', background: 'rgba(43,92,63,0.1)', borderRadius: 6, padding: '2px 6px' }}>You</span>
                                    )}
                                </span>
                                <span style={{ color: '#2b5c3f', fontWeight: 900 }}>{p.score} pts</span>
                            </div>
                        ))}
                    </div>
                )}

                <button
                    className="game-btn primary"
                    onClick={() => { disconnect(); navigate('/'); }}
                    style={{ padding: '14px 40px', fontSize: 16 }}
                >
                    Back to Home
                </button>
            </div>
        );
    }

    return <div>Loading...</div>;
}

export default ParticipantPlayView;
