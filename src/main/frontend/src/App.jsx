import React, { useState } from 'react';
import StartPage from './pages/FlashcardStartPage';
import StudyPage from './pages/StudyPage';
import CreateFlashcardSetPage from './pages/CreateFlashcardSetPage';

function App() {
  const [started, setStarted] = useState(false); // Have they clicked "Learn"?
  const [studyMode, setStudyMode] = useState(null); // "term" or "definition"
  const [creating, setCreating] = useState(false);

  const handleSaveNewSet = (setData) => {
    console.log('New flashcard set:', setData);
    // TODO: POST to /api/flashcard-sets once backend integration is done
    alert('Flashcard set created! (fake rn lol)');
    setCreating(false); // back to start page
  };

  if (creating) {
    return (
      <CreateFlashcardSetPage
        onCancel={() => setCreating(false)} // back to start page
        onSave={handleSaveNewSet} // eventually will do something real
      />
    );
  }

  return (
    <div>
      {!started && (
        <StartPage
          onStart={() => setStarted(true)}
          onCreate={() => setCreating(true)}
        />
      )}
      {started && !studyMode && (
        <div style={{ textAlign: 'center', marginTop: '100px' }}>
          <h2>Choose what appears on the front of the flashcards:</h2>
          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '20px' }}>
            <button onClick={() => setStudyMode('term')}>Term on Front</button>
            <button onClick={() => setStudyMode('definition')}>Definition on Front</button>
          </div>
        </div>
      )}
      {started && studyMode && (
        <StudyPage onBack={() => { setStarted(false); setStudyMode(null); }} studyMode={studyMode} />
      )}
    </div>
  );
}

export default App;