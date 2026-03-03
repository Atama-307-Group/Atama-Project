import React, { useState } from 'react';
import './StudyPage.css';

const StudyPage = ({ studyMode, flashcards, onDone }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [flippedCards, setFlippedCards] = useState(new Set());
  const [cards, setCards] = useState(flashcards);

  if (!cards || cards.length === 0) {
    return (
      <div style={{ textAlign: 'center', marginTop: '50px' }}>
        <h2>No cards to study</h2>
        <button onClick={() => onDone(0)}>Done</button>
      </div>
    );
  }

  const currentCard = cards[currentIndex];

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
    if (!isFlipped) {
      const newFlipped = new Set(flippedCards);
      newFlipped.add(currentIndex);
      setFlippedCards(newFlipped);
    }
  };

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % cards.length);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev === 0 ? cards.length - 1 : prev - 1));
  };

  const toggleFavorite = () => {
    const updated = [...cards];
    updated[currentIndex].favorite = !updated[currentIndex].favorite;
    setCards(updated);
  };

  return (
    <div style={{ maxWidth: '500px', margin: '50px auto', textAlign: 'center' }}>
      <h2>Study Mode: {studyMode === 'term' ? 'Term on Front' : 'Definition on Front'}</h2>

      {/* Flippable card */}
      <div className="card-container" onClick={handleFlip}>
        <div className={`card ${isFlipped ? 'flipped' : ''}`}>
          <div className="front">
            {studyMode === 'term' ? currentCard.term : currentCard.definition}
          </div>
          <div className="back">
            {studyMode === 'term' ? currentCard.definition : currentCard.term}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button onClick={handlePrev} style={{ marginRight: '10px' }}>Previous</button>
        <button onClick={handleNext}>Next</button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button onClick={toggleFavorite}>
          {currentCard.favorite ? '★ Unfavorite' : '☆ Favorite'}
        </button>
      </div>

      <p style={{ marginBottom: '20px' }}>
        Card {currentIndex + 1} of {cards.length}
      </p>

      <button
        onClick={() => onDone(flippedCards.size)}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          borderRadius: '5px',
          cursor: 'pointer',
        }}
      >
        Done
      </button>
    </div>
  );
};

export default StudyPage;