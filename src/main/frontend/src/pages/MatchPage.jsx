import React, { useState, useEffect, useRef } from 'react';

const MatchPage = ({ flashcards, onDone }) => {
  const [cards, setCards] = useState([]);
  const [first, setFirst] = useState(null);
  const [second, setSecond] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const [time, setTime] = useState(0);
  const timerRef = useRef(null);

  // Prepare shuffled cards
  useEffect(() => {
    let tempCards = [];
    flashcards.forEach((card, idx) => {
      tempCards.push({ id: idx + 't', content: card.term, pairId: idx, matched: false });
      tempCards.push({ id: idx + 'd', content: card.definition, pairId: idx, matched: false });
    });
    tempCards.sort(() => Math.random() - 0.5);
    setCards(tempCards);
  }, [flashcards]);

  // Start timer
  useEffect(() => {
    const start = Date.now();

    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - start) / 1000;
      setTime(elapsed);
    }, 100);

    return () => clearInterval(timerRef.current);
  }, []);

  const handleClick = (card) => {
    if (card.matched || first === card || second === card) return;

    if (!first) {
      setFirst(card);
    } else if (!second) {
      setSecond(card);
    }
  };

  // Check match
  useEffect(() => {
    if (first && second) {
      setAttempts((prev) => prev + 1);

      if (first.pairId === second.pairId) {
        setCards((prev) =>
          prev.map((c) =>
            c.pairId === first.pairId ? { ...c, matched: true } : c
          )
        );
      }

      const timeout = setTimeout(() => {
        setFirst(null);
        setSecond(null);
      }, 400);

      return () => clearTimeout(timeout);
    }
  }, [first, second]);

  // Completion check
  useEffect(() => {
    if (cards.length > 0 && cards.every((c) => c.matched)) {
      clearInterval(timerRef.current);

      const finalTime = time.toFixed(1);

      setTimeout(() => {
        onDone(attempts, finalTime);
      }, 400);
    }
  }, [cards, attempts, time, onDone]);

  return (
    <div style={{ maxWidth: '800px', margin: '50px auto', textAlign: 'center' }}>
      <h2>Match the Terms and Definitions</h2>
      <p>Attempts: {attempts}</p>
      <p>Time: {time.toFixed(1)}s</p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: '10px',
          marginTop: '20px',
        }}
      >
        {cards
          .filter((card) => !card.matched) // matched cards disappear
          .map((card) => (
            <div
              key={card.id}
              onClick={() => handleClick(card)}
              style={{
                padding: '20px',
                border: '2px solid #333',
                borderRadius: '10px',
                backgroundColor:
                  first === card || second === card ? '#ffe0b2' : '#fff',
                cursor: 'pointer',
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