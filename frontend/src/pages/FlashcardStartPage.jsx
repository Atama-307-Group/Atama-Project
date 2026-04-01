import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './FlashcardStartPage.css';

const FlashcardStartPage = ({ currentUser, onLogout, recentSets = [] }) => {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const mostRecent = recentSets[0] || null;

  return (
    <div className="start-page">
      <div className="top-bar">
        {currentUser ? (
          <div className="profile-section" ref={dropdownRef}>
            <div className="profile-trigger" onClick={() => setDropdownOpen(!dropdownOpen)}>
              {currentUser.profilePictureUrl ? (
                <img src={currentUser.profilePictureUrl} alt="" className="avatar-img" />
              ) : (
                <div className="avatar">{currentUser.username.charAt(0).toUpperCase()}</div>
              )}
              <span className="profile-username">{currentUser.username}</span>
              <span className={`dropdown-arrow ${dropdownOpen ? 'open' : ''}`}>▾</span>
            </div>
            {dropdownOpen && (
              <div className="dropdown-menu">
                <div className="dropdown-header">
                  {currentUser.profilePictureUrl ? (
                    <img src={currentUser.profilePictureUrl} alt="" className="dropdown-avatar-img" />
                  ) : (
                    <div className="dropdown-avatar">{currentUser.username.charAt(0).toUpperCase()}</div>
                  )}
                  <div className="dropdown-info">
                    <span className="dropdown-name">{currentUser.username}</span>
                    <span className="dropdown-email">{currentUser.email}</span>
                  </div>
                </div>
                <div className="dropdown-divider" />
                <button className="dropdown-item" onClick={() => { setDropdownOpen(false); navigate('/profile'); }}>
                  Profile
                </button>
                <button className="dropdown-item logout-btn" onClick={onLogout}>
                  Log Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="auth-buttons">
            <button className="auth-btn signup-btn" onClick={() => navigate('/signup')}>Sign Up</button>
            <button className="auth-btn login-btn" onClick={() => navigate('/login')}>Log In</button>
          </div>
        )}
      </div>

      {currentUser ? (
        <div className="dashboard">
          <div className="dashboard-header">
            <div>
              <p className="greeting-sub">Hello,</p>
              <p className="greeting-name">{currentUser.username}</p>
            </div>
            <div className="nav-buttons">
              <button className="nav-btn" onClick={() => navigate('/folders')}>Library</button>
              <button className="nav-btn" onClick={() => navigate('/university')}>University</button>
            </div>
          </div>

          {mostRecent && (
            <div className="resume-card">
              <div>
                <p className="resume-label">Continue studying</p>
                <p className="resume-title">{mostRecent.title}</p>
                <p className="resume-meta">{mostRecent.courseCode && `${mostRecent.courseCode} · `}{mostRecent.cardCount} cards</p>
              </div>
              <button className="resume-btn" onClick={() => navigate(`/pre_learn`)}>Resume →</button>
            </div>
          )}

          <p className="section-label">Study</p>
          <div className="study-grid">
            <div className="study-card" onClick={() => navigate('/pre_learn')}>
              <div className="study-icon study-icon--blue">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-info)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                </svg>
              </div>
              <p className="study-card-title">Learn</p>
              <p className="study-card-sub">Flashcard review</p>
            </div>
            <div className="study-card" onClick={() => navigate('/pre_match')}>
              <div className="study-icon study-icon--green">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                  <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                </svg>
              </div>
              <p className="study-card-title">Match</p>
              <p className="study-card-sub">Match terms</p>
            </div>
            <div className="study-card" onClick={() => navigate('/pre_test')}>
              <div className="study-icon study-icon--amber">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-warning)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
              </div>
              <p className="study-card-title">Practice test</p>
              <p className="study-card-sub">Quiz yourself</p>
            </div>
          </div>

          <div className="action-grid">
            <div className="action-card action-card--goals" onClick={() => navigate('/goals')}>
              <div className="study-icon study-icon--muted">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
              </div>
              <div>
                <p className="study-card-title">Goals</p>
                <p className="study-card-sub">Track your progress</p>
              </div>
            </div>
            <div className="action-card action-card--create" onClick={() => navigate('/create')}>
              <div className="study-icon study-icon--muted">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </div>
              <div>
                <p className="study-card-title">Create new set</p>
                <p className="study-card-sub">Add flashcards</p>
              </div>
            </div>
          </div>

          {recentSets.length > 0 && (
            <>
              <p className="section-label">Recent</p>
              <div className="recent-list">
                {recentSets.map((set, i) => (
                  <div key={set.id || i} className="recent-item" onClick={() => navigate(`/pre_learn`)}>
                    <div>
                      <p className="recent-title">{set.title}</p>
                      <p className="recent-meta">{set.courseCode && `${set.courseCode} · `}{set.cardCount} cards</p>
                    </div>
                    <p className="recent-time">{set.lastStudied}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="start-content landing">
          <h1>Study smarter with Atama</h1>
          <p className="tagline">Study flashcards and share course materials, all in one place.</p>
          <div className="auth-buttons">
            <button className="auth-btn signup-btn" onClick={() => navigate('/signup')}>Get Started</button>
            <button className="auth-btn login-btn" onClick={() => navigate('/login')}>Log In</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlashcardStartPage;