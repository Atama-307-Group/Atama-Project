/*import React, { useState } from 'react';
import StartPage from './pages/FlashcardStartPage';
import StudyPage from './pages/StudyPage';
import CreateFlashcardSetPage from './pages/CreateFlashcardSetPage';
import SignupPage from "./pages/SignupPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
function FoldersPage() {
  const [started, setStarted] = useState(false); // Have they clicked "Learn"?
  const [studyMode, setStudyMode] = useState(null); // "term" or "definition"
  const [creating, setCreating] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  const [currentUser, setCurrentUser] = useState(() => {
      const saved = localStorage.getItem('currentUser');
      return saved ? JSON.parse(saved) : null;
  });
  const handleSaveNewSet = (savedSet) => {
    console.log('Saved flashcard set:', savedSet);
    setCreating(false); // back to start page
  };
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

  if (creating) {
    return (
      <CreateFlashcardSetPage
        onCancel={() => setCreating(false)} // back to start page
        onSave={handleSaveNewSet} // eventually will do something real
      />
    );
  }
  if (showLogin) {
      return (
          <LoginPage
              onBack={() => setShowLogin(false)}
              onLoginSuccess={handleLoginSuccess}
              onSignupClick={() => {
                  setShowLogin(false);
                  setShowSignup(true);
              }}
          />
      );
  }
    if (showSignup) {
        return (
            <SignupPage
                onBack={() => setShowSignup(false)}
                onLoginClick={() => {
                    setShowSignup(false);
                    setShowLogin(true);
                }}
            />
        );
    }

    return (
        <div>
            {!started && (
                <StartPage
                    onStart={() => setStarted(true)}
                    onCreate={() => setCreating(true)}
                    onSignup={() => setShowSignup(true)}
                    onLoginClick={() => setShowLogin(true)}
                    currentUser={currentUser}
                    onLogout={handleLogout}
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
                <StudyPage
                    onBack={() => {
                        setStarted(false);
                        setStudyMode(null);
                    }}
                    studyMode={studyMode}
                />
            )}
        </div>
    );
}

export default FoldersPage;*/
import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import StartPage from './pages/FlashcardStartPage.jsx';
import StudyPage from './pages/StudyPage.jsx';
import CreateFlashcardSetPage from './pages/CreateFlashcardSetPage.jsx';
import SignupPage from './pages/SignupPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import FoldersPage from './pages/FoldersPage.jsx';
import FlashcardSetPage from './pages/FlashcardSetPage.jsx';
function App() {
    const [currentUser, setCurrentUser] = useState(() => {
        const saved = localStorage.getItem('currentUser');
        return saved ? JSON.parse(saved) : null;
    });

    const handleLoginSuccess = (id, username, email) => {
        const user = { id, username, email };
        setCurrentUser(user);
        localStorage.setItem('currentUser', JSON.stringify(user));
    };

    const handleLogout = () => {
        setCurrentUser(null);
        localStorage.removeItem('currentUser');
    };

    return (
        <Routes>

            {/* Home / Dashboard */}
            <Route
                path="/"
                element={
                    <StartPage
                        currentUser={currentUser}
                        onLogout={handleLogout}
                    />
                }
            />

            {/* Auth Routes */}
            <Route
                path="/login"
                element={
                    <LoginPage
                        onLoginSuccess={handleLoginSuccess}
                    />
                }
            />

            <Route
                path="/signup"
                element={<SignupPage />}
            />

            {/* Create Flashcard Set */}
            <Route
                path="/create"
                element={
                    // currentUser
                    //     ? <CreateFlashcardSetPage />
                    //     : <Navigate to="/login" />
                    <CreateFlashcardSetPage />
                }
            />

            {/* Study Page */}
            <Route
                path="/study/:mode"
                element={<StudyPage />}
            />

            <Route
                path="/sets/:id"
                element={<FlashcardSetPage />}
            />

            {/* Personal Library Page */}
            <Route
                path="/folders"
                element={
                    // currentUser
                    //     ? <FoldersPage />
                    //     : <Navigate to ="/login" />
                    <FoldersPage />
            }
            />

            {/* Catch-all */}
            <Route
                path="*"
                element={<Navigate to="/" />}
            />

        </Routes>
    );
}

export default App;