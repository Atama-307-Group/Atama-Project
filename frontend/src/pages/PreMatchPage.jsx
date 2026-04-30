import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton.jsx';
import './PreSettingsPage.css';

const PreMatchPage = () => {
    const { state } = useLocation();
    const flashcards = state?.flashcards || [];
    const setTitle = state?.setTitle || '';
    const [favoritesOnly, setFavoritesOnly] = useState(false);
    const navigate = useNavigate();

    if (flashcards.length === 0) {
        return (
            <div className="presettings-shell">
                <div className="presettings-card">
                    <p className="presettings-empty">No flashcards found. Please go back and select a set.</p>
                    <button className="presettings-start-btn" onClick={() => navigate('/')}>Return Home</button>
                </div>
            </div>
        );
    }

    const handleStart = () => {
        const selected = favoritesOnly ? flashcards.filter((c) => c.favorite) : flashcards;
        navigate('/match', { state: { selectedCards: selected, setId: state?.setId } });
    };

    return (
        <div className="presettings-shell">
            <div className="presettings-card">
                <div className="presettings-back"><BackButton /></div>

                <div className="presettings-header">
                    <div>
                        <h2 className="presettings-title">Learn Settings</h2>
                        {setTitle && <p className="presettings-subtitle">{setTitle}</p>}
                    </div>
                </div>

                <div className="presettings-divider" />

                <div className="presettings-section">
                    <p className="presettings-section-label">Options</p>
                    <label className={`presettings-checkbox-option ${favoritesOnly ? 'presettings-checkbox-option--active' : ''}`}>
                        <input
                            type="checkbox"
                            checked={favoritesOnly}
                            onChange={() => setFavoritesOnly(!favoritesOnly)}
                            className="presettings-checkbox-input"
                        />
                        <span className="presettings-checkbox-box">{favoritesOnly && '✓'}</span>
                        Favorited cards only
                    </label>
                </div>

                <button className="presettings-start-btn" onClick={handleStart}>
                    Start Match
                </button>
            </div>
        </div>
    );
};

export default PreMatchPage;