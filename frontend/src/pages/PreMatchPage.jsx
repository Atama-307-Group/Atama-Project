import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton.jsx';

const PreMatchPage = () => {
    const { state } = useLocation();
    const flashcards = state?.flashcards || [];
    const setTitle = state?.setTitle || '';

    const [favoritesOnly, setFavoritesOnly] = useState(false);
    const navigate = useNavigate();

    if (flashcards.length === 0) {
        return (
            <div style={{ textAlign: 'center', marginTop: '100px' }}>
                <p>No flashcards found. Please go back and select a set.</p>
                <button onClick={() => navigate('/')}>Return Home</button>
            </div>
        );
    }

    const handleStart = () => {
        const selected = favoritesOnly
            ? flashcards.filter((card) => card.favorite)
            : flashcards;

        navigate('/match', { state: { selectedCards: selected, setId: state?.setId } });
    };

    return (
        <div style={{ maxWidth: '500px', margin: '50px auto', textAlign: 'center' }}>
            <BackButton />
            <h2>Match Settings</h2>
            {setTitle && <p style={{ color: '#666', marginTop: 0 }}>{setTitle}</p>}
            <label>
                <input
                    type="checkbox"
                    checked={favoritesOnly}
                    onChange={() => setFavoritesOnly(!favoritesOnly)}
                />
                Favorited cards only
            </label>
            <div style={{ marginTop: '30px' }}>
                <button
                    onClick={handleStart}
                    style={{ padding: '10px 20px', fontSize: '16px', borderRadius: '5px', cursor: 'pointer' }}
                >
                    Start Match
                </button>
            </div>
        </div>
    );
};

export default PreMatchPage;