import React from 'react';
import './Flashcard.css';

const Flashcard = ({
  flashcard,
  question,
  answer,
  flipped,
  onFlip,
  onFavoriteUpdate
}) => {

  const handleFavoriteClick = async (e) => {
    e.stopPropagation();

    const response = await fetch(
      `/api/flashcard-sets/flashcards/${flashcard.id}/favorite`,
      { method: "PUT" }
    );

    const updatedCard = await response.json();
    onFavoriteUpdate(updatedCard);
  };

  return (
    <div className="flashcard-container">

      <div className="favorite-star" onClick={handleFavoriteClick}>
        <span className="tooltip-text">Favorite</span>
        <span style={{ color: flashcard.favorite ? 'gold' : '#ccc' }}>
          ★
        </span>
      </div>

      <div
        className={`flashcard-inner ${flipped ? 'flipped' : ''}`}
        onClick={onFlip}
      >
        <div className="flashcard front">{question}</div>
        <div className="flashcard back">{answer}</div>
      </div>
    </div>
  );
};

export default Flashcard;