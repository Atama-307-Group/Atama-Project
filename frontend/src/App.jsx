import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useTimer } from './context/TimerContext';
import TimerPopup from './components/TimerPopup.jsx';

import StartPage from './pages/FlashcardStartPage.jsx';
import StudyPage from './pages/StudyPage.jsx';
import CreateFlashcardSetPage from './pages/CreateFlashcardSetPage.jsx';
import SignupPage from './pages/SignupPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import FoldersPage from './pages/FoldersPage.jsx';
import FlashcardSetPage from './pages/FlashcardSetPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import ChangePasswordPage from './pages/ChangePasswordPage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx';
import ResetPasswordPage from './pages/ResetPasswordPage.jsx';
import PreMatchPage from "./pages/PreMatchPage.jsx";
import MatchPage from './pages/MatchPage.jsx';
import PostMatchPage from "./pages/PostMatchPage.jsx";
import PreLearnPage from "./pages/PreLearnPage.jsx";
import PostLearnPage from "./pages/PostLearnPage.jsx";
import PreTestPage from "./pages/PreTestPage.jsx";
import PracticeTestPage from "./pages/PracticeTestPage.jsx";
import PostTestPage from "./pages/PostTestPage.jsx";
import GoalsPage from "./pages/StudyGoal.jsx"
import UniversityPage from './pages/UniversityPage.jsx';
import SharedSetPage from "./pages/SharedSetPage.jsx";
import CoursePage from './pages/CoursePage.jsx';


function App() {
    const { openPopup } = useTimer();

    const [currentUser, setCurrentUser] = useState(() => {
        const saved = localStorage.getItem('currentUser');
        return saved ? JSON.parse(saved) : null;
    })

    const [flashcards, setFlashcards] = useState([
        { id: 1, type: 'REGULAR', term: 'Mitosis', definition: 'Cell division producing two identical daughter cells', favorite: false },
        { id: 2, type: 'REGULAR', term: 'Osmosis', definition: 'Movement of water through a semipermeable membrane', favorite: false },
        { id: 3, type: 'REGULAR', term: 'Photosynthesis', definition: 'Process by which plants convert sunlight into glucose', favorite: false },
        { id: 4, type: 'REGULAR', term: 'Homeostasis', definition: 'Maintaining a stable internal environment', favorite: false },
        { id: 5, type: 'REGULAR', term: 'Meiosis', definition: 'Cell division producing four genetically unique gametes', favorite: false },
        { id: 6, type: 'REGULAR', term: 'DNA', definition: 'Molecule carrying genetic instructions for life', favorite: false },

        {
            id: 7,
            type: 'FILL_BLANK',
            textWithBlanks: 'This app is called __ and is a project for CS __.',
            correctAnswers: ['Atama', '307'],
            favorite: true
        },
        {
            id: 8,
            type: 'FILL_BLANK',
            textWithBlanks: 'Water freezes at __°C and boils at __°C at sea level.',
            correctAnswers: ['0', '100'],
            favorite: true
        },
        {
            id: 9,
            type: 'FILL_BLANK',
            textWithBlanks: 'The chemical symbol for Gold is __ and for Silver is __.',
            correctAnswers: ['Au', 'Ag'],
            favorite: true
        }
    ]);

    const handleToggleFavorite = (id) => {
        setFlashcards(prev =>
            prev.map(card => card.id === id ? { ...card, favorite: !card.favorite } : card)
        );
    };

    const handleLoginSuccess = (id, username, email, profilePictureUrl, verified) => {
        const user = { id, username, email, profilePictureUrl, verified };
        setCurrentUser(user);
        localStorage.setItem('currentUser', JSON.stringify(user));
    };

    const handleLogout = () => {
        setCurrentUser(null);
        localStorage.removeItem('currentUser');
    };

    return (
        <>
            {currentUser && <TimerPopup />}

            {currentUser && (
            <button 
                onClick={openPopup}
                style={{
                    position: 'fixed',
                    bottom: '24px',
                    right: '24px',
                    padding: '12px 24px',
                    background: '#2b5c3f',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(43, 92, 63, 0.3)',
                    zIndex: 1000,
                    transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 16px rgba(43, 92, 63, 0.4)';
                }}
                onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 12px rgba(43, 92, 63, 0.3)';
                }}
            >
                ⏱
            </button>
             )}

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

            {/* Forgot / Reset Password */}
            <Route
                path="/forgot-password"
                element={<ForgotPasswordPage />}
            />

            <Route
                path="/reset-password"
                element={<ResetPasswordPage />}
            />

            {/* Profile & Account Management */}
            <Route
                path="/profile"
                element={
                    currentUser
                        ? <ProfilePage currentUser={currentUser} />
                        : <Navigate to="/login" />
                }
            />

            <Route
                path="/change-password"
                element={
                    currentUser
                        ? <ChangePasswordPage currentUser={currentUser} />
                        : <Navigate to="/login" />
                }
            />

            {/* Create Flashcard Set */}
            <Route
                path="/create"
                element={
                    // currentUser
                    //     ? <CreateFlashcardSetPage />
                    //     : <Navigate to="/login" />
                    <CreateFlashcardSetPage onSave={setFlashcards} />
                }
            />

            {/* Study & Learning Flow */}
            <Route path="/pre_learn" element={<PreLearnPage flashcards={flashcards} />} />
            <Route path="/study" element={<StudyPage onToggleFavorite={handleToggleFavorite} userId={currentUser?.id}/>} />
            <Route path="/post_learn" element={<PostLearnPage />} />

            {/* Match Flow */}
            <Route path="/pre_match" element={<PreMatchPage flashcards={flashcards} />} />
            <Route path="/match" element={<MatchPage />} />
            <Route path="/post_match" element={<PostMatchPage />} />

            {/* Test Flow */}
            <Route path="/pre_test" element={<PreTestPage flashcards={flashcards} />} />
            <Route path="/practice_test" element={<PracticeTestPage />} />
            <Route path="/post_test" element={<PostTestPage />} />

            <Route
                path="/sets/:id"
                element={<FlashcardSetPage />}
            />
            <Route path="/shared/:token" element={<SharedSetPage />} />

            {/* Personal Library Page */}
            <Route
                path="/folders"
                element={currentUser ? <FoldersPage /> : <Navigate to="/login" />}
            />

            {/* Study Goals Page */}
            <Route
                path="/goals"
                element={currentUser ? <GoalsPage userId={currentUser.id} /> : <Navigate to="/login" />}
            />

            {/* University Page */}
            <Route
                path="/university"
                element={currentUser ? <UniversityPage userId={currentUser.id} /> : <Navigate to="/login" />}
            />

            {/* Course Page */}
            <Route
                path="/course/:courseId"
                element={<CoursePage userId={currentUser?.id} />}
            />

            {/* Catch-all */}
            <Route
                path="*"
                element={<Navigate to="/" />}
            />

            </Routes>
        </>
    );
}

export default App;
