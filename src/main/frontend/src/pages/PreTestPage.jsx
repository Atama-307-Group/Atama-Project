import React, { useState } from 'react';

const PreTestPage = ({ flashcards, onStartTest }) => {
  const [promptType, setPromptType] = useState('term'); // term or definition
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [numQuestions, setNumQuestions] = useState(flashcards.length);

  const handleStart = () => {
    let cardsPool = flashcards;
    if (favoritesOnly) {
      cardsPool = flashcards.filter((c) => c.favorite);
    }
    if (cardsPool.length === 0) {
      alert("No cards available for the test!");
      return;
    }
    onStartTest(promptType, cardsPool, Math.min(numQuestions, cardsPool.length));
  };

  return (
    <div style={{ maxWidth: '500px', margin: '50px auto', textAlign: 'center' }}>
      <h2>Practice Test Settings</h2>

      <div>
        <h3>Prompt Type</h3>
        <label>
          <input
            type="radio"
            value="term"
            checked={promptType === 'term'}
            onChange={() => setPromptType('term')}
          />{' '}
          Term on Front
        </label>
        <br />
        <label>
          <input
            type="radio"
            value="definition"
            checked={promptType === 'definition'}
            onChange={() => setPromptType('definition')}
          />{' '}
          Definition on Front
        </label>
      </div>

      <div style={{ marginTop: '20px' }}>
        <label>
          <input
            type="checkbox"
            checked={favoritesOnly}
            onChange={() => setFavoritesOnly(!favoritesOnly)}
          />{' '}
          Favorited cards only
        </label>
      </div>

      <div style={{ marginTop: '20px' }}>
        <label>
          Number of questions:{' '}
          <input
            type="number"
            min="1"
            max={flashcards.length}
            value={numQuestions}
            onChange={(e) => setNumQuestions(Number(e.target.value))}
          />
        </label>
      </div>

      <button
        onClick={handleStart}
        style={{ marginTop: '30px', padding: '10px 20px', fontSize: '16px' }}
      >
        Start Test
      </button>
    </div>
  );
};

export default PreTestPage;