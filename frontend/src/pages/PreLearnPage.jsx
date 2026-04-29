import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton.jsx';

const PreLearnPage = () => {
    const { state } = useLocation();
    const flashcards = state?.flashcards || [];
    const setTitle = state?.setTitle || '';

    const [frontChoice, setFrontChoice] = useState('term');
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
        let cardsToStudy = favoritesOnly
            ? flashcards.filter((card) => card.favorite)
            : flashcards;

        navigate('/study', {
            state: { frontChoice, cards: cardsToStudy, setId: state?.setId }
        });
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        }}>
            <div style={{ maxWidth: '500px', width: '100%', fontFamily: 'sans-serif', textAlign: 'center' }}>
                <BackButton />
                <h2>Learn Settings</h2>
                {setTitle && <p style={{ color: '#666', marginTop: 0 }}>{setTitle}</p>}
                <h3>Front of Card:</h3>
                <div>
                    <label>
                        <input type="radio" value="term" checked={frontChoice === 'term'}
                               onChange={() => setFrontChoice('term')} /> Term
                    </label>
                    <br />
                    <label>
                        <input type="radio" value="definition" checked={frontChoice === 'definition'}
                               onChange={() => setFrontChoice('definition')} /> Definition
                    </label>
                </div>
                <h3>Other Options:</h3>
                <div style={{ marginTop: '20px' }}>
                    <label>
                        <input type="checkbox" checked={favoritesOnly}
                               onChange={() => setFavoritesOnly(!favoritesOnly)} /> Favorited cards only
                    </label>
                </div>
                <div style={{ marginTop: '30px' }}>
                    <button onClick={handleStart} style={{ padding: '10px 20px', fontSize: '16px', borderRadius: '5px' }}>
                        Start Learning
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PreLearnPage;