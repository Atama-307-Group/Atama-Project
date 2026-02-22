import React, { useState } from 'react';
import StartPage from './pages/FlashcardStartPage';
import StudyPage from './pages/StudyPage';

function App() {
  const [started, setStarted] = useState(false); // Have they clicked "Learn"?
  const [studyMode, setStudyMode] = useState(null); // "term" or "definition"

  return (
    <div>
      {!started && <StartPage onStart={() => setStarted(true)} />}
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