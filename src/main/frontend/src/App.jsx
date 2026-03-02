import React, { useState } from 'react';
import StartPage from './pages/FlashcardStartPage';
import StudyPage from './pages/StudyPage';
import SignupPage from './pages/SignupPage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';

function App() {
  const [started, setStarted] = useState(false);
  const [studyMode, setStudyMode] = useState(null);
  const [showSignup, setShowSignup] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('currentUser');
    return saved ? JSON.parse(saved) : null;
  });

  const handleLoginSuccess = (id, username, email) => {
    const user = { id, username, email };
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
    setShowLogin(false);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    setStarted(false);
    setStudyMode(null);
  };

  return (
    <div>
      {showProfile && currentUser ? (
        <ProfilePage
          currentUser={currentUser}
          onBack={() => setShowProfile(false)}
        />
      ) : showLogin ? (
        <LoginPage
          onBack={() => setShowLogin(false)}
          onLoginSuccess={handleLoginSuccess}
          onSignupClick={() => { setShowLogin(false); setShowSignup(true); }}
        />
      ) : showSignup ? (
        <SignupPage
          onBack={() => setShowSignup(false)}
          onLoginClick={() => { setShowSignup(false); setShowLogin(true); }}
        />
      ) : (
        <>
          {!started && (
            <StartPage
              onStart={() => setStarted(true)}
              onSignup={() => setShowSignup(true)}
              onLoginClick={() => setShowLogin(true)}
              currentUser={currentUser}
              onLogout={handleLogout}
              onProfile={() => setShowProfile(true)}
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
        </>
      )}
    </div>
  );
}

export default App;