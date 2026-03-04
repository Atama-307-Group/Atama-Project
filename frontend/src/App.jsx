import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import StartPage from './pages/FlashcardStartPage.jsx';
import StudyPage from './pages/StudyPage.jsx';
import CreateFlashcardSetPage from './pages/CreateFlashcardSetPage.jsx';
import SignupPage from './pages/SignupPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import FoldersPage from './pages/FoldersPage.jsx';
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

function App() {
    const [currentUser, setCurrentUser] = useState(() => {
        const saved = localStorage.getItem('currentUser');
        return saved ? JSON.parse(saved) : null;
    })

    const [flashcards, setFlashcards] = useState([
        { id: 1, term: 'Mitosis', definition: 'Cell division producing two identical daughter cells', favorite: false },
        { id: 2, term: 'Osmosis', definition: 'Movement of water through a semipermeable membrane', favorite: true },
        { id: 3, term: 'Photosynthesis', definition: 'Process by which plants convert sunlight into glucose', favorite: false },
        { id: 4, term: 'Homeostasis', definition: 'Maintaining a stable internal environment', favorite: true },
        { id: 5, term: 'Meiosis', definition: 'Cell division producing four genetically unique gametes', favorite: false },
        { id: 6, term: 'DNA', definition: 'Molecule carrying genetic instructions for life', favorite: false },
    ]);

    const handleToggleFavorite = (id) => {
        setFlashcards(prev =>
            prev.map(card => card.id === id ? { ...card, favorite: !card.favorite } : card)
        );
    };

    const handleLoginSuccess = (id, username, email, profilePictureUrl) => {
        const user = { id, username, email, profilePictureUrl };
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
            <Route path="/study" element={<StudyPage onToggleFavorite={handleToggleFavorite}/>} />
            <Route path="/post_learn" element={<PostLearnPage />} />

            {/* Match Flow */}
            <Route path="/pre_match" element={<PreMatchPage flashcards={flashcards} />} />
            <Route path="/match" element={<MatchPage />} />
            <Route path="/post_match" element={<PostMatchPage />} />

            {/* Test Flow */}
            <Route path="/pre_test" element={<PreTestPage flashcards={flashcards} />} />
            <Route path="/practice_test" element={<PracticeTestPage />} />
            <Route path="/post_test" element={<PostTestPage />} />

            {/* Personal Library Page */}
            <Route
                path="/folders"
                element={currentUser ? <FoldersPage /> : <Navigate to="/login" />}
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