import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import { useTimer } from './context/TimerContext';
import TimerPopup from './components/TimerPopup.jsx';

import AdminDashboard from './pages/admin/AdminPage.jsx';
import StartPage from './pages/LandingPage.jsx';
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
import CountdownPage from "./pages/CountdownPage.jsx";
import UniversityPage from './pages/UniversityPage.jsx';
import SharedSetPage from "./pages/SharedSetPage.jsx";
import CoursePage from './pages/CoursePage.jsx';
import ExamReminderBanner from "./components/ExamReminderBanner.jsx";
import DesktopNotification from "./components/DesktopNotification.jsx";
import PickSetPage from './pages/PickSetPage.jsx';
import SearchPage from "./pages/SearchPage.jsx";
import SettingsPage from './pages/SettingsPage.jsx';
import StudyGroupPage from "./pages/StudyGroupPage.jsx";
import StudyGroupsListPage from "./pages/StudyGroupsListPage.jsx";
import ConceptMapPage from "./pages/ConceptMapPage.jsx";
import HostGameView from './pages/game/HostGameView.jsx';
import ParticipantJoinView from './pages/game/ParticipantJoinView.jsx';
import ParticipantPlayView from './pages/game/ParticipantPlayView.jsx';

function App() {
    const { openPopup } = useTimer();

    const [currentUser, setCurrentUser] = useState(() => {
        const saved = localStorage.getItem('currentUser');
        return saved ? JSON.parse(saved) : null;
    });

    const [aiDisabled, setAiDisabled] = useState(() => {
        const saved = localStorage.getItem('currentUser');
        return saved ? JSON.parse(saved).aiDisabled ?? false : false;
    });

    const handleLoginSuccess = (id, username, email, profilePictureUrl, verified, isAdmin) => {
        const user = { id, username, email, profilePictureUrl, verified, isAdmin };
        setCurrentUser(user);
        setAiDisabled(aiDisabled ?? false);
        localStorage.setItem('currentUser', JSON.stringify(user));
    };

    const handleLogout = () => {
        setCurrentUser(null);
        localStorage.removeItem('currentUser');
    };

    const handleAiDisabledChange = (val) => {
        setAiDisabled(val);
        const updated = { ...currentUser, aiDisabled: val };
        setCurrentUser(updated);
        localStorage.setItem('currentUser', JSON.stringify(updated));
    };

    return (
        <>
            <ExamReminderBanner userId={currentUser?.id} />
            <DesktopNotification userId={currentUser?.id} />
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
                <Route path="/login" element={<LoginPage onLoginSuccess={handleLoginSuccess} />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />

                {/* Profile & Account Management */}
                <Route
                    path="/profile"
                    element={currentUser ? <ProfilePage currentUser={currentUser} /> : <Navigate to="/login" />}
                />
                <Route
                    path="/change-password"
                    element={currentUser ? <ChangePasswordPage currentUser={currentUser} /> : <Navigate to="/login" />}
                />

                {/* Create Flashcard Set */}
                <Route
                    path="/create"
                    element={currentUser
                        ? <CreateFlashcardSetPage aiDisabled={aiDisabled} />
                        : <Navigate to="/login" />}
                />

                {/* Pick a set to study */}
                <Route
                    path="/pick-set"
                    element={currentUser ? <PickSetPage /> : <Navigate to="/login" />}
                />

                {/* Study & Learning Flow — flashcards passed via router state */}
                <Route path="/pre_learn" element={<PreLearnPage />} />
                <Route path="/study" element={<StudyPage onToggleFavorite={() => {}} userId={currentUser?.id} />} />
                <Route path="/post_learn" element={<PostLearnPage />} />

                {/* Match Flow */}
                <Route path="/pre_match" element={<PreMatchPage />} />
                <Route path="/match" element={<MatchPage userId={currentUser?.id} />} />
                <Route path="/post_match" element={<PostMatchPage />} />

                {/* Test Flow */}
                <Route path="/pre_test" element={<PreTestPage />} />
                <Route path="/practice_test" element={<PracticeTestPage userId={currentUser?.id} />} />
                <Route path="/post_test" element={<PostTestPage />} />

                <Route path="/sets/:id" element={<FlashcardSetPage currentUser={currentUser} />} />
                <Route path="/shared/:token" element={<SharedSetPage />} />
                <Route path="/concept-maps/:id" element={currentUser ? <ConceptMapPage /> : <Navigate to="/login" />} />

                {/* Multiplayer Games */}
                <Route path="/game/host/:joinCode" element={currentUser ? <HostGameView currentUser={currentUser} /> : <Navigate to="/login" />} />
                <Route path="/game/play/:joinCode" element={<ParticipantPlayView currentUser={currentUser} />} />
                <Route path="/game/join" element={<ParticipantJoinView currentUser={currentUser} />} />
                <Route path="/game/join/:joinCode" element={<ParticipantJoinView currentUser={currentUser} />} />

                {/* Personal Library */}
                <Route
                    path="/folders"
                    element={currentUser ? <FoldersPage userId={currentUser.id} /> : <Navigate to="/login" />}
                />

                {/* Study Goals Page */}
                <Route
                    path="/goals"
                    element={currentUser ? <GoalsPage userId={currentUser.id} /> : <Navigate to="/login" />}
                />

                {/* University Page */}
                <Route
                    path="/university"
                    element={currentUser ? <UniversityPage userId={currentUser?.id} /> : <Navigate to="/login" />}
                />

                {/* Course Page */}
                <Route
                    path="/course/:courseId"
                    element={<CoursePage userId={currentUser?.id} />}
                />

                {/* Exam Countdowns Page */}
                <Route
                    path="/countdowns"
                    element={<CountdownPage userId={currentUser?.id} />}
                />


                {/* Study Groups list for a course */}
                <Route
                    path="/courses/:courseId/groups"
                    element={currentUser ? <StudyGroupsListPage userId={currentUser.id} /> : <Navigate to="/login" />}
                />

                {/* Individual study group */}
                <Route
                    path="/groups/:groupId"
                    element={currentUser ? <StudyGroupPage userId={currentUser.id} /> : <Navigate to="/login" />}
                />

                {/* Search Page */}
                <Route
                    path="/search"
                    element={<SearchPage />}
                />

                {/* Settings Page */}
                <Route
                    path="/settings"
                    element={currentUser
                        ? <SettingsPage
                            currentUser={currentUser}
                            aiDisabled={aiDisabled}
                            onAiDisabledChange={handleAiDisabledChange}
                          />
                        : <Navigate to="/login" />}
                />


                <Route
                    path="/admin"
                    element={
                        currentUser?.isAdmin
                            ? <AdminDashboard currentUser={currentUser} onLogout={handleLogout} />
                            : <Navigate to="/" />
                    }
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