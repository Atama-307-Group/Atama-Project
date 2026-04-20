import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { validateGame } from '../../api';
import { useGame } from '../../context/GameContext';
import './game.css';

function ParticipantJoinView({ currentUser }) {
    const { joinCode: urlCode } = useParams();
    const navigate = useNavigate();
    const [pin, setPin] = useState(urlCode || '');
    const [nickname, setNickname] = useState(currentUser ? currentUser.username : '');
    const [error, setError] = useState('');
    
    // Check login
    useEffect(() => {
        if (!currentUser) {
            // Redirect to login but save the URL they wanted to join
            alert("You must be logged in to join a game!");
            navigate('/login');
        }
    }, [currentUser, navigate]);

    const handleJoin = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await validateGame(pin);
            navigate(`/game/play/${pin}`);
        } catch (err) {
            setError('Invalid PIN or game not found.');
        }
    };

    if (!currentUser) return null;

    return (
        <div className="game-container game-bg-join centered flex-col">
            <h1 className="kahoot-logo-text">Atama!</h1>
            <form className="join-form" onSubmit={handleJoin}>
                <input 
                    type="text" 
                    placeholder="Game PIN" 
                    value={pin} 
                    onChange={e => setPin(e.target.value)}
                    required
                    className="game-input"
                    maxLength={6}
                />
                <button type="submit" className="game-btn enter-btn">Enter</button>
                {error && <p className="game-error">{error}</p>}
            </form>
        </div>
    );
}

export default ParticipantJoinView;
