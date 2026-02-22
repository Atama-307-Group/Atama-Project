import React, { useState } from 'react';
import Flashcard from '../components/Flashcard';

const sampleFlashcards = [
  { term: 'React', definition: 'A JavaScript library for building UIs.' },
  { term: 'JSX', definition: 'A syntax extension for JavaScript that looks like HTML.' },
  { term: 'Component', definition: 'Reusable piece of UI in React.' },
];

const StudyPage = ({ onBack, studyMode }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const handleFlip = () => setFlipped(!flipped);

  const nextCard = () => {
    if (currentIndex < sampleFlashcards.length - 1) {
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

  const currentCard = sampleFlashcards[currentIndex];

  // Determine front/back based on studyMode
  const front = studyMode === 'term' ? currentCard.term : currentCard.definition;
  const back = studyMode === 'term' ? currentCard.definition : currentCard.term;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '50px' }}>
      <h1>Study Session</h1>
      <Flashcard question={front} answer={back} flipped={flipped} onFlip={handleFlip} />
      <div style={{ marginTop: '10px' }}>
        <button onClick={prevCard} disabled={currentIndex === 0} style={{ margin: '5px' }}>
          Previous
        </button>

        <button onClick={nextCard} disabled={currentIndex === sampleFlashcards.length - 1} style={{ margin: '5px' }}>
          Next
        </button>

        <button onClick={onBack} style = {{ margin: '5px' }}>
            Done
        </button>
      </div>
      <p>
        Flashcard {currentIndex + 1} / {sampleFlashcards.length}
      </p>
    </div>
  );
};

export default StudyPage;