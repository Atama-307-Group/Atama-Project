import React, { useState } from 'react';
import StartPage from './pages/FlashcardStartPage';
import StudyPage from './pages/StudyPage';
import SignupPage from './pages/SignupPage';

function App() {
  const [started, setStarted] = useState(false); // Have they clicked "Learn"?
  const [studyMode, setStudyMode] = useState(null); // "term" or "definition"
  const [showSignup, setShowSignup] = useState(false);

  return (
    <div>
      {showSignup ? (
        <SignupPage
          onBack={() => setShowSignup(false)}
          onLoginClick={() => { /* stub */ alert("Login soon...") }}
        />
      ) : (
        <>
          {!started && <StartPage onStart={() => setStarted(true)} onSignup={() => setShowSignup(true)} />}
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
        </>
      )}
    </div>
  );
}

export default App;