import React, { useState } from 'react';

const PreLearnPage = ({ onStart, flashcards }) => {
  const [frontChoice, setFrontChoice] = useState('term'); // default
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  const handleStart = () => {
    let cardsToStudy = flashcards;
    if (favoritesOnly) {
      cardsToStudy = flashcards.filter((card) => card.favorite);
    }
    onStart(frontChoice, cardsToStudy);
  };

  return (
    <div style={{ maxWidth: '500px', margin: '50px auto', fontFamily: 'sans-serif' }}>
      <h2>Front of Card:</h2>
      <div>
        <label>
          <input
            type="radio"
            value="term"
            checked={frontChoice === 'term'}
            onChange={() => setFrontChoice('term')}
          />
          Term
        </label>
        <br />
        <label>
          <input
            type="radio"
            value="definition"
            checked={frontChoice === 'definition'}
            onChange={() => setFrontChoice('definition')}
          />
          Definition
        </label>
      </div>

      <h3 style={{ marginTop: '30px' }}>Optional Settings:</h3>
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
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
        >
          Start Learning
        </button>
      </div>
    </div>

  );
};

export default PreLearnPage;