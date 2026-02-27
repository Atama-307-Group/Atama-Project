import React, { useState } from 'react';
import Flashcard from '../components/Flashcard';
import './StudyPage.css';

const sampleFlashcards = [
  { term: 'React', definition: 'A JavaScript library for building UIs.', favorite: false },
  { term: 'JSX', definition: 'A syntax extension for JavaScript that looks like HTML.', favorite: false },
  { term: 'Component', definition: 'Reusable piece of UI in React.', favorite: false },
];

const StudyPage = ({ onBack, studyMode, initialFlashcards }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const handleFlip = () => setFlipped(!flipped);

  const nextCard = () => {
    if (currentIndex < initialFlashcards.length - 1) {
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

  const currentCard = initialFlashcards[currentIndex];

  const front = studyMode === 'term' ? currentCard.term : currentCard.definition;
  const back = studyMode === 'term' ? currentCard.definition : currentCard.term;

  return (
    <div className="study-page-container">
      <h1>Study Session</h1>

      <Flashcard question={front} answer={back} flipped={flipped} onFlip={handleFlip} />

      <div className="study-buttons">
        <button onClick={prevCard} disabled={currentIndex === 0}>
          Previous
        </button>
        <button onClick={nextCard} disabled={currentIndex === initialFlashcards.length - 1}>
          Next
        </button>
        <button onClick={onBack}>Done</button>
      </div>

      <p className="card-counter">
        Card {currentIndex + 1} / {initialFlashcards.length}
      </p>
    </div>
  );
};

export default StudyPage;