import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const PreLearnPage = ({ flashcards }) => {
    const [frontChoice, setFrontChoice] = useState('term');
    const [favoritesOnly, setFavoritesOnly] = useState(false);
    const navigate = useNavigate();

    const handleStart = () => {
        let cardsToStudy = favoritesOnly
            ? flashcards.filter((card) => card.favorite)
            : flashcards;

        navigate('/study', {
            state: {
                frontChoice,
                cards: cardsToStudy
            }
        });
    };

    return (
        <div style={{ maxWidth: '500px', margin: '50px auto', fontFamily: 'sans-serif' }}>
            <h2>Study Settings</h2>
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
            <div style={{ marginTop: '20px' }}>
                <label>
                    <input type="checkbox" checked={favoritesOnly}
                           onChange={() => setFavoritesOnly(!favoritesOnly)} /> Favorited cards only
                </label>
            </div>
            <div style={{ marginTop: '30px' }}>
                <button onClick={handleStart} style={{ padding: '10px 20px', fontSize: '16px' }}>
                    Start Learning
                </button>
            </div>
        </div>
    );
};

export default PreLearnPage;