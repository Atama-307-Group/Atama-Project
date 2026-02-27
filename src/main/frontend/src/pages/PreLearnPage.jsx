import React, { useState } from 'react';
import './PreLearnPage.css';

const PreLearnPage = ({ onStart, flashcards }) => {
  const [studyMode, setStudyMode] = useState('term');
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  const handleStart = () => {
    // Filter flashcards if favoritesOnly is checked
    const cardsToUse = favoritesOnly
      ? flashcards.filter((card) => card.favorite)
      : flashcards;

    onStart(studyMode, cardsToUse);
  };

  return (
    <div className="prelearn-container">
      <h1>Pre-Learn Options</h1>

      {/* Front of Card */}
      <div className="section">
        <h2>Front of Card:</h2>
        <label>
          <input
            type="radio"
            name="front"
            value="term"
            checked={studyMode === 'term'}
            onChange={() => setStudyMode('term')}
          />
          Term
        </label>
        <label>
          <input
            type="radio"
            name="front"
            value="definition"
            checked={studyMode === 'definition'}
            onChange={() => setStudyMode('definition')}
          />
          Definition
        </label>
      </div>

      {/* Optional Settings */}
      <div className="section">
        <h2>Optional Settings:</h2>
        <label>
          <input
            type="checkbox"
            checked={favoritesOnly}
            onChange={() => setFavoritesOnly(!favoritesOnly)}
          />
          Favorited cards only
        </label>
      </div>

      {/* Start Button */}
      <button className="start-button" onClick={handleStart}>
        Start Learning
      </button>
    </div>
  );
};

export default PreLearnPage;