import React, { useState, useEffect } from 'react';

const MatchPage = ({ flashcards, onDone }) => {
  const [cards, setCards] = useState([]);
  const [first, setFirst] = useState(null);
  const [second, setSecond] = useState(null);
  const [attempts, setAttempts] = useState(0);

  // Prepare shuffled cards with duplicate pairs (term & definition)
  useEffect(() => {
    let tempCards = [];
    flashcards.forEach((card, idx) => {
      tempCards.push({ id: idx + 't', content: card.term, pairId: idx, matched: false });
      tempCards.push({ id: idx + 'd', content: card.definition, pairId: idx, matched: false });
    });
    tempCards.sort(() => Math.random() - 0.5); // shuffle
    setCards(tempCards);
  }, [flashcards]);

  const handleClick = (card) => {
    if (card.matched || first === card || second === card) return;

    if (!first) setFirst(card);
    else if (!second) setSecond(card);
  };

  // Check match
  useEffect(() => {
    if (first && second) {
      setAttempts((prev) => prev + 1); // increment attempt count

      if (first.pairId === second.pairId) {
        setCards((prev) =>
          prev.map((c) =>
            c.pairId === first.pairId ? { ...c, matched: true } : c
          )
        );
      }

      // Reset selection after short delay
      const timeout = setTimeout(() => {
        setFirst(null);
        setSecond(null);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [first, second]);

  // Check if all matched
  useEffect(() => {
    if (cards.length && cards.every((c) => c.matched)) {
      setTimeout(() => onDone(attempts), 500);
    }
  }, [cards, attempts, onDone]);

  return (
    <div style={{ maxWidth: '800px', margin: '50px auto', textAlign: 'center' }}>
      <h2>Match the Terms and Definitions</h2>
      <p>Attempts: {attempts}</p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: '10px',
          marginTop: '20px',
        }}
      >
        {cards.map((card) => (
          <div
            key={card.id}
            onClick={() => handleClick(card)}
            style={{
              padding: '20px',
              border: '2px solid #333',
              borderRadius: '10px',
              backgroundColor: card.matched
                ? '#a0ffa0'
                : first === card || second === card
                ? '#ffe0b2'
                : '#fff',
              cursor: card.matched ? 'default' : 'pointer',
              userSelect: 'none',
            }}
          >
            {card.content}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MatchPage;