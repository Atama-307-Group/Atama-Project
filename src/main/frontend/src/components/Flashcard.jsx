import React, { useState } from 'react';
import './Flashcard.css';

const Flashcard = ({ question, answer, flipped, onFlip }) => {
  const [favorite, setFavorite] = useState(false);

  const handleFavoriteClick = (e) => {
    e.stopPropagation(); // prevent flipping
    setFavorite(!favorite);
  };

  return (
    <div className="flashcard-container">
      {/* Star */}
      <div className="favorite-star" onClick={handleFavoriteClick}>
        <span className="tooltip-text">Favorite</span>
        <span style={{ color: favorite ? 'gold' : '#ccc' }}>★</span>
      </div>

      {/* Flip wrapper */}
      <div className={`flashcard-inner ${flipped ? 'flipped' : ''}`} onClick={onFlip}>
        <div className="flashcard front">{question}</div>
        <div className="flashcard back">{answer}</div>
      </div>
    </div>
  );
};

export default Flashcard;