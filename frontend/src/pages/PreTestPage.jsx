import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const PreTestPage = () => {
    const { state } = useLocation();
    const flashcards = state?.flashcards || [];
    const setTitle = state?.setTitle || '';

    const [promptType, setPromptType] = useState('term');
    const [favoritesOnly, setFavoritesOnly] = useState(false);
    const [numQuestions, setNumQuestions] = useState(flashcards.length);
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
        let cardsPool = favoritesOnly ? flashcards.filter((c) => c.favorite) : flashcards;

        if (cardsPool.length === 0) {
            alert('No cards available for the test!');
            return;
        }

        navigate('/practice_test', {
            state: {
                promptType,
                cards: cardsPool,
                numQuestions: Math.min(numQuestions, cardsPool.length),
                setId: state?.setId,
            }
        });
    };

    return (
        <div style={{ maxWidth: '500px', margin: '50px auto', textAlign: 'center' }}>
            <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', marginBottom: '1rem' }}>← Back</button>
            <h2>Practice Test Settings</h2>
            {setTitle && <p style={{ color: '#666', marginTop: 0 }}>{setTitle}</p>}
            <div>
                <h3>Prompt Type</h3>
                <label>
                    <input type="radio" value="term" checked={promptType === 'term'} onChange={() => setPromptType('term')} /> Term
                </label>
                <br />
                <label>
                    <input type="radio" value="definition" checked={promptType === 'definition'} onChange={() => setPromptType('definition')} /> Definition
                </label>
            </div>
            <div style={{ marginTop: '20px' }}>
                <label>
                    <input type="checkbox" checked={favoritesOnly} onChange={() => setFavoritesOnly(!favoritesOnly)} /> Favorited cards only
                </label>
            </div>
            <div style={{ marginTop: '20px' }}>
                <label>
                    Number of questions:
                    <input type="number" min="1" max={flashcards.length} value={numQuestions} onChange={(e) => setNumQuestions(Number(e.target.value))} />
                </label>
            </div>
            <button onClick={handleStart} style={{ borderRadius: '5px', marginTop: '30px', padding: '10px 20px', fontSize: '16px' }}>
                Start Test
            </button>
        </div>
    );
};

export default PreTestPage;