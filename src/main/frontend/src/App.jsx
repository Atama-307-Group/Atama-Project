import React, { useState } from 'react';
import StartPage from './pages/FlashcardStartPage';
import PreLearnPage from './pages/PreLearnPage';
import StudyPage from './pages/StudyPage';

const sampleFlashcards = [
  { term: 'React', definition: 'A JavaScript library for building UIs.', favorite: false },
  { term: 'JSX', definition: 'A syntax extension for JavaScript that looks like HTML.', favorite: false },
  { term: 'Component', definition: 'Reusable piece of UI in React.', favorite: false },
];

function App() {
  const [phase, setPhase] = useState('start'); // 'start' | 'prelearn' | 'study'
  const [studyMode, setStudyMode] = useState('term');
  const [cards, setCards] = useState([]);

  const handlePreLearnStart = (mode, filteredCards) => {
    setStudyMode(mode);
    setCards(filteredCards);
    setPhase('study');
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
          onBack={() => setPhase('start')}
          studyMode={studyMode}
          initialFlashcards={cards}
        />
      )}
    </div>
  );
}

export default App;