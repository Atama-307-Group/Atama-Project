import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './StudyPage.css';

const StudyPage = ({ onToggleFavorite }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Safely extract the state passed from PreLearnPage
  const studyMode = location.state?.frontChoice || 'term';
  const flashcards = location.state?.cards || [];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [flippedCards, setFlippedCards] = useState(new Set());
  const [cards, setCards] = useState(flashcards);

  // SAFETY CHECK: If someone goes to /study directly, send them home
  if (!flashcards || flashcards.length === 0) {
    return (
        <div style={{ textAlign: 'center', marginTop: '100px' }}>
          <h2>No cards found for this session.</h2>
          <button onClick={() => navigate('/')}>Return Home</button>
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

  const handleDone = () => {
    // Navigate to results and pass the count
    navigate('/post_learn', {
      state: { studiedCount: flippedCards.size, totalCount: cards.length }
    });
  };

const handleToggleFavorite = (e) => {
    e.stopPropagation(); // prevent card flip
    onToggleFavorite(currentCard.id);
    // also update local cards so the star reflects immediately
    setCards(prev =>
        prev.map(c => c.id === currentCard.id ? { ...c, favorite: !c.favorite } : c)
    );
};

    return (
        <div style={{ maxWidth: '500px', margin: '50px auto', textAlign: 'center' }}>
            <h2>Learn</h2>

            {/* Wrapper gives us a positioned parent for the star */}
            <div style={{ position: 'relative', display: 'inline-block' }}>

                {/* ⭐ STAR GOES HERE */}
                <button
                    onClick={handleToggleFavorite}
                    title="Favorite"
                    style={{
                        position: 'absolute',
                        top: '10px',
                        right: '24px',
                        zIndex: 10,
                        background: 'none',
                        border: 'none',
                        fontSize: '24px',
                        cursor: 'pointer',
                        color: currentCard.favorite ? '#f5c518' : '#ccc',
                        transition: 'color 0.2s',
                    }}
                >
                    ★
                </button>

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

            </div>

            <div style={{ marginBottom: '20px' }}>
                <button onClick={handlePrev} style={{ marginRight: '10px' }}>Previous</button>
                <button onClick={handleNext}>Next</button>
            </div>

            <p>Card {currentIndex + 1} of {cards.length}</p>

            <button onClick={handleDone} style={{ padding: '10px 20px', cursor: 'pointer' }}>
                Finish Session
            </button>
        </div>
    );
};

export default StudyPage;