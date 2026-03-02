import React, { useState, useEffect } from 'react';
import StartPage from './pages/FlashcardStartPage';
import PreLearnPage from './pages/PreLearnPage';
import StudyPage from './pages/StudyPage';
import PostLearnPage from './pages/PostLearnPage';

function App() {
  const [phase, setPhase] = useState('start');
  const [studyMode, setStudyMode] = useState('term');
  const [cards, setCards] = useState([]);
  const [studiedCount, setStudiedCount] = useState(0);

  useEffect(() => {
    fetch(`/api/flashcard-sets/${setId}/flashcards`)
      .then(res => res.json())
      .then(data => setCards(data));
  }, []);

  const handlePreLearnStart = (mode, filteredCards) => {
    setStudyMode(mode);
    setCards(filteredCards);
    setPhase('study');
  };

  const handleStudyComplete = (count) => {
    setStudiedCount(count);
    setPhase('postlearn');
  };

  return (
    <div>
      {phase === 'start' && (
        <StartPage onStart={() => setPhase('prelearn')} />
      )}

      {phase === 'prelearn' && (
        <PreLearnPage
          flashcards={cards}
          onStart={handlePreLearnStart}
        />
      )}

      {phase === 'study' && (
        <StudyPage
          studyMode={studyMode}
          flashcards={cards}
          onUpdateFlashcard={(updatedCard) => {
            setCards(prev =>
              prev.map(card =>
                card.id === updatedCard.id ? updatedCard : card
              )
            );
          }}
          onComplete={handleStudyComplete}
        />
      )}

      {phase === 'postlearn' && (
        <PostLearnPage
          studiedCount={studiedCount}
          totalCount={cards.length}
          onRestart={() => setPhase('start')}
        />
      )}
    </div>
  );
}

export default App;