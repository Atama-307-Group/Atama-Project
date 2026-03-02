import React, { useState } from 'react';
import Flashcard from '../components/Flashcard';

const StudyPage = ({ onComplete, studyMode, flashcards, onUpdateFlashcard }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  // Track studied cards
  const [studiedCards, setStudiedCards] = useState(new Set());

  const handleFlip = () => {
    if (!flipped) {
      // Only count first flip
      setStudiedCards(prev => new Set(prev).add(currentIndex));
    }
    setFlipped(!flipped);
  };

  const nextCard = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setFlipped(false);
    }
  };

  const prevCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setFlipped(false);
    }
  };

  const currentCard = flashcards[currentIndex];

  const front =
    studyMode === 'term' ? currentCard.term : currentCard.definition;

  const back =
    studyMode === 'term' ? currentCard.definition : currentCard.term;

  return (
    <div className="study-page-container">
      <h1>Study Session</h1>

      <Flashcard
          flashcard={currentCard}
          question={front}
          answer={back}
          flipped={flipped}
          onFlip={handleFlip}
          onFavoriteUpdate={onUpdateFlashcard}
      />

      <div className="study-buttons">
        <button onClick={prevCard} disabled={currentIndex === 0}>
          Previous
        </button>
        <button
          onClick={nextCard}
          disabled={currentIndex === flashcards.length - 1}
        >
          Next
        </button>
        <button onClick={() => onComplete(studiedCards.size)}>
          Done
        </button>
      </div>

      <p>
        Card {currentIndex + 1} / {flashcards.length}
      </p>
    </div>
  );
};

export default StudyPage;