import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { startStudying, stopStudying, addSetStudyTime } from "../api.js";

const MatchPage = ({ userId }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const flashcards = location.state?.selectedCards || [];
  const setId = location.state?.setId || null;
  const hasStoppedRef = useRef(false);
  const sessionStartRef = useRef(Date.now());

  const [cards, setCards] = useState([]);
  const [first, setFirst] = useState(null);
  const [second, setSecond] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const [time, setTime] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!userId) return;
    startStudying(userId).catch(console.error);
    return () => {
      if (!hasStoppedRef.current) stopStudying(userId).catch(console.error);
    };
  }, [userId]);

  useEffect(() => {
    const handleUnload = () => {
      stopStudying(userId).catch(console.error);
      if (setId) {
        const seconds = Math.floor((Date.now() - sessionStartRef.current) / 1000);
        addSetStudyTime(setId, seconds).catch(console.error);
      }
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [userId, setId]);

  useEffect(() => {
    if (flashcards.length === 0) return;
    const limitedCards = [...flashcards].sort(() => Math.random() - 0.5).slice(0, 6);
    let tempCards = [];
    limitedCards.forEach((card, index) => {
      const isFITB = card.type === 'FILL_BLANK';
      const frontText = isFITB ? card.textWithBlanks : card.term;
      const backText = isFITB ? card.correctAnswers.join(', ') : card.definition;
      tempCards.push({ id: `t-${index}`, content: frontText, pairId: index, matched: false });
      tempCards.push({ id: `d-${index}`, content: backText, pairId: index, matched: false });
    });
    tempCards.sort(() => Math.random() - 0.5);
    setCards(tempCards);

    const start = Date.now();
    timerRef.current = setInterval(() => {
      setTime((Date.now() - start) / 1000);
    }, 100);
    return () => clearInterval(timerRef.current);
  }, [flashcards]);

  const handleClick = (card) => {
    if (card.matched) return;
    if (first?.id === card.id) return;
    if (second) return;
    if (!first) setFirst(card);
    else { setSecond(card); setAttempts(a => a + 1); }
  };

  useEffect(() => {
    if (first && second) {
      if (first.pairId === second.pairId) {
        setCards(prev => prev.map(c => c.pairId === first.pairId ? { ...c, matched: true } : c));
      }
      setTimeout(() => { setFirst(null); setSecond(null); }, 500);
    }
  }, [first, second]);

  useEffect(() => {
    if (cards.length > 0 && cards.every(c => c.matched)) {
      clearInterval(timerRef.current);
      if (!hasStoppedRef.current) {
        hasStoppedRef.current = true;
        stopStudying(userId).catch(console.error);
        if (setId) {
          const seconds = Math.floor((Date.now() - sessionStartRef.current) / 1000);
          addSetStudyTime(setId, seconds).catch(console.error);
        }
      }
      navigate('/post_match', { state: { attempts, time: time.toFixed(1) } });
    }
  }, [cards, attempts, time, navigate]);

  if (flashcards.length === 0) return <button onClick={() => navigate('/')}>Return to Home</button>;

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h2>Time: {time.toFixed(1)}s | Attempts: {attempts}</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', maxWidth: '800px', margin: 'auto' }}>
        {cards.map(card => (
          <div
            key={card.id}
            onClick={() => handleClick(card)}
            style={{
              padding: '20px', border: '2px solid #333', borderRadius: '8px',
              visibility: card.matched ? 'hidden' : 'visible',
              backgroundColor: (first === card || second === card) ? '#ffd700' : '#fff',
              cursor: 'pointer'
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