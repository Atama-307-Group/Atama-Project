import React from 'react';
import './Flashcard.css';

const Flashcard = ({ question, answer, flipped, onFlip }) => {
  return (
    <div className="flashcard-container" onClick={onFlip}>
      <div className={`flashcard ${flipped ? 'flipped' : ''}`}>
        <div className="front">{question}</div>
        <div className="back">{answer}</div>
      </div>
    </div>
  );
};

export default Flashcard;