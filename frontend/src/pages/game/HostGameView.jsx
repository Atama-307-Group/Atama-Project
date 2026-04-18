import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../../context/GameContext';
import './game.css';

/* ── Auto-advancing Leaderboard ────────────────────────────────── */
function LeaderboardWithCountdown({ players, onNext, onEndGame }) {
    const [seconds, setSeconds] = useState(5);
    const [fired, setFired] = useState(false);

    useEffect(() => {
        if (seconds <= 0 && !fired) {
            setFired(true);
            onNext();
            return;
        }
        const id = setTimeout(() => setSeconds(s => s - 1), 1000);
        return () => clearTimeout(id);
    }, [seconds, fired, onNext]);

    const sorted = [...players].sort((a, b) => b.score - a.score).slice(0, 5);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', width: '100%', maxWidth: '640px', padding: '32px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <h1 style={{ margin: 0, fontSize: 28, fontWeight: 950, color: '#1E352F' }}>Leaderboard</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        background: 'linear-gradient(135deg, #2b5c3f, #1e4530)',
                        color: 'white',
                        borderRadius: '50%',
                        width: 44, height: 44,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 20, fontWeight: 950,
                        boxShadow: '0 4px 14px rgba(43,92,63,0.3)',
                    }}>
                        {seconds}
                    </div>
                    <button
                        className="game-btn secondary"
                        onClick={() => { setFired(true); onNext(); }}
                        style={{ padding: '10px 20px', fontSize: 14 }}
                    >
                        Skip
                    </button>
                    <button
                        className="game-btn"
                        onClick={onEndGame}
                        style={{ padding: '10px 18px', fontSize: 14, background: '#fff0f0', color: '#c0392b', border: '1.5px solid rgba(192,57,43,0.3)' }}
                    >
                        End Game
                    </button>
                </div>
            </div>

            <div className="leaderboard" style={{ width: '100%' }}>
                <h2>Top Players</h2>
                {sorted.length === 0 && <p style={{ color: '#7a9e90', textAlign: 'center' }}>No scores yet</p>}
                {sorted.map((p, idx) => (
                    <div key={idx} className="leaderboard-row">
                        <span>
                            <span style={{
                                display: 'inline-block', width: 28, height: 28,
                                lineHeight: '28px', textAlign: 'center',
                                borderRadius: '50%',
                                background: idx === 0 ? '#f5c518' : idx === 1 ? '#adb5bd' : idx === 2 ? '#cd7f32' : 'rgba(51,81,69,0.08)',
                                color: idx < 3 ? '#1a1000' : '#1E352F',
                                fontSize: 13, fontWeight: 900,
                                marginRight: 10,
                            }}>{idx + 1}</span>
                            {p.nickname}
                        </span>
                        <span style={{ color: '#2b5c3f', fontWeight: 900 }}>{p.score} pts</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function HostGameView({ currentUser }) {
    const { joinCode } = useParams();
    const navigate = useNavigate();
    const { 
        connected, gameState, players, currentQuestion, participantId, submitAnswer,
        connectToGame, startGame, nextQuestion, endQuestion, endGame, disconnect 
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
                    {players.length === 0 && <p className="game-waiting-hint">Waiting for players…</p>}
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
                    <div style={{ display: 'flex', gap: 10 }}>
                        <button className="game-btn secondary" onClick={endQuestion}>Skip / Show Answer</button>
                        <button
                            className="game-btn"
                            onClick={endGame}
                            style={{ padding: '10px 18px', fontSize: 14, background: '#fff0f0', color: '#c0392b', border: '1.5px solid rgba(192,57,43,0.3)' }}
                        >
                            End Game
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (gameState === 'QUESTION_ENDED') {
        return (
            <div className="game-container game-bg-host flex-col centered">
                <LeaderboardWithCountdown
                    players={players}
                    onNext={nextQuestion}
                    onEndGame={endGame}
                />
            </div>
        );
    }

    if (gameState === 'FINISHED') {
        const sorted = [...players].sort((a, b) => b.score - a.score);
        const podiumData = [
            { p: sorted[1], label: '2nd', bg: 'linear-gradient(135deg,#adb5bd,#868e96)', color: '#fff', h: 200 },
            { p: sorted[0], label: '1st', bg: 'linear-gradient(135deg,#f5c518,#e6a800)', color: '#1a1000', h: 260 },
            { p: sorted[2], label: '3rd', bg: 'linear-gradient(135deg,#cd7f32,#a0522d)', color: '#fff', h: 160 },
        ];
        return (
            <div className="game-container game-bg-host flex-col centered" style={{ gap: 0, padding: '40px 24px' }}>
                <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 900, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#7a9e90' }}>Game Over</p>
                <h1 style={{ margin: '0 0 40px', fontSize: 36, fontWeight: 950, color: '#1E352F' }}>Final Standings</h1>

                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginBottom: 40 }}>
                    {podiumData.map(({ p, label, bg, color, h }, i) => (
                        p ? (
                            <div key={i} style={{
                                width: 148, height: h,
                                background: bg,
                                borderRadius: '14px 14px 0 0',
                                display: 'flex', flexDirection: 'column',
                                alignItems: 'center', justifyContent: 'flex-end',
                                padding: '0 10px 16px',
                                boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
                                color,
                            }}>
                                <p style={{ margin: '0 0 2px', fontSize: 16, fontWeight: 900, textAlign: 'center', lineHeight: 1.2 }}>{p.nickname}</p>
                                <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 700, opacity: 0.8 }}>{p.score} pts</p>
                                <p style={{ margin: 0, fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.65 }}>{label}</p>
                            </div>
                        ) : <div key={i} style={{ width: 148 }} />
                    ))}
                </div>

                {sorted.length > 3 && (
                    <div className="leaderboard" style={{ width: '100%', maxWidth: 480, marginBottom: 32 }}>
                        <h2>All Players</h2>
                        {sorted.slice(3).map((p, i) => (
                            <div key={i} className="leaderboard-row">
                                <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <span style={{ display:'inline-flex', width:24, height:24, borderRadius:'50%', background:'rgba(51,81,69,0.08)', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:900, color:'#1E352F' }}>{i + 4}</span>
                                    {p.nickname}
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

export default HostGameView;
