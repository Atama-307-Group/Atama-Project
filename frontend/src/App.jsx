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

function App() {
    const [currentUser, setCurrentUser] = useState(() => {
        const saved = localStorage.getItem('currentUser');
        return saved ? JSON.parse(saved) : null;
    });

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
                    <CreateFlashcardSetPage />
                }
            />

            {/* Study Page */}
            <Route
                path="/study/:mode"
                element={<StudyPage />}
            />

            {/* Personal Library Page */}
            <Route
                path="/folders"
                element={currentUser ? <FoldersPage /> : <Navigate to="/login" />}
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