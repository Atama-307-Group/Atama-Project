import React, { useState } from 'react';
import StartPage from './pages/FlashcardStartPage';
import PreLearnPage from './pages/PreLearnPage';
import StudyPage from './pages/StudyPage';
import PostLearnPage from './pages/PostLearnPage';

const sampleFlashcards = [
  { term: 'React', definition: 'A JavaScript library for building UIs.', favorite: false },
  { term: 'JSX', definition: 'A syntax extension for JavaScript that looks like HTML.', favorite: false },
  { term: 'Component', definition: 'Reusable piece of UI in React.', favorite: false },
];

function App() {
  const [phase, setPhase] = useState('start');
  const [studyMode, setStudyMode] = useState('term');
  const [cards, setCards] = useState([]);
  const [studiedCount, setStudiedCount] = useState(0);

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
          flashcards={sampleFlashcards}
          onStart={handlePreLearnStart}
        />
      )}

      {phase === 'study' && (
        <StudyPage
          studyMode={studyMode}
          initialFlashcards={cards}
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