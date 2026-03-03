import React, { useState } from 'react';

const PreMatchPage = ({ flashcards, onStart }) => {
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  const handleStart = () => {
    const selected = favoritesOnly
      ? flashcards.filter((card) => card.favorite)
      : flashcards;
    onStart(selected);
  };

  return (
    <div style={{ maxWidth: '500px', margin: '50px auto', textAlign: 'center' }}>
      <h2>Match Mode Settings</h2>
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