import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './FlashcardStartPage.css';

const FlashcardStartPage = ({ currentUser, onLogout, recentSets = [] }) => {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState("");


  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function onSearch(e) {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) navigate(`/search?q=${encodeURIComponent(q)}`);
  }
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
                  Profile Settings
                </button>
                <button className="dropdown-item" onClick={() => { setDropdownOpen(false); navigate('/settings'); }}>
                    Settings
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
          </div>

          {mostRecent && (
            <div className="resume-card">
              <div>
                <p className="resume-label">Continue studying</p>
                <p className="resume-title">{mostRecent.title}</p>
                <p className="resume-meta">{mostRecent.courseCode && `${mostRecent.courseCode} · `}{mostRecent.cardCount} cards</p>
              </div>
              <button className="resume-btn" onClick={() => navigate(`/pick-set?mode=learn`)}>Resume →</button>
            </div>
          )}

          <p className="section-label">Study</p>

          <form onSubmit={onSearch} style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
            <input
                className="search-input"
                placeholder="Search folders, flashcard sets, PDFs…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '14px' }}
            />
            <button type="submit" className="auth-btn login-btn">Search</button>
          </form>

          <div className="study-grid">
            <div className="study-card" onClick={() => navigate('/pick-set?mode=learn')}>
              <div className="study-icon study-icon--blue">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-info)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-brain-icon lucide-brain"><path d="M12 18V5"/><path d="M15 13a4.17 4.17 0 0 1-3-4 4.17 4.17 0 0 1-3 4"/><path d="M17.598 6.5A3 3 0 1 0 12 5a3 3 0 1 0-5.598 1.5"/><path d="M17.997 5.125a4 4 0 0 1 2.526 5.77"/><path d="M18 18a4 4 0 0 0 2-7.464"/><path d="M19.967 17.483A4 4 0 1 1 12 18a4 4 0 1 1-7.967-.517"/><path d="M6 18a4 4 0 0 1-2-7.464"/><path d="M6.003 5.125a4 4 0 0 0-2.526 5.77"/></svg>
                </svg>
              </div>
              <p className="study-card-title">Learn</p>
              <p className="study-card-sub">Flashcard review</p>
            </div>
            <div className="study-card" onClick={() => navigate('/pick-set?mode=match')}>
              <div className="study-icon study-icon--green">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                  <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-copy-slash-icon lucide-copy-slash"><line x1="12" x2="18" y1="18" y2="12"/><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                </svg>
              </div>
              <p className="study-card-title">Match</p>
              <p className="study-card-sub">Match terms</p>
            </div>
            <div className="study-card" onClick={() => navigate('/pick-set?mode=test')}>
              <div className="study-icon study-icon--amber">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-warning)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-notebook-text-icon lucide-notebook-text"><path d="M2 6h4"/><path d="M2 10h4"/><path d="M2 14h4"/><path d="M2 18h4"/><rect width="16" height="20" x="4" y="2" rx="2"/><path d="M9.5 8h5"/><path d="M9.5 12H16"/><path d="M9.5 16H14"/></svg>
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
            <div className="action-card action-card--create" onClick={() => navigate('/create')}>
              <div className="study-icon study-icon--muted">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#335145" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </div>
              <div>
                <p className="study-card-title">New Flashcard Set</p>
                <p className="study-card-sub">Create your ideal study set</p>
              </div>
            </div>
          </div>

          <p className="section-label" style={{marginTop: '16px'}}>Your pages</p>
          <div className="study-grid" style={{marginBottom: '28px'}}>
            <div className="study-card" onClick={() => navigate('/folders')}>
              <div className="study-icon study-icon--blue">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#335145" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <p className="study-card-title">Library</p>
              <p className="study-card-sub">Your study materials</p>
            </div>
            <div className="study-card" onClick={() => navigate('/university')}>
              <div className="study-icon study-icon--green">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#335145" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
              </div>
              <p className="study-card-title">University</p>
              <p className="study-card-sub">Browse courses</p>
            </div>
            <div className="study-card" onClick={() => navigate('/goals')}>
              <div className="study-icon study-icon--amber">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#335145" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
              </div>
              <p className="study-card-title">Goals</p>
              <p className="study-card-sub">Track your progress</p>
            </div>
          </div>

          {recentSets.length > 0 && (
            <>
              <p className="section-label">Recent</p>
              <div className="recent-list">
                {recentSets.map((set, i) => (
                  <div key={set.id || i} className="recent-item" onClick={() => navigate(`/sets/${set.id}`)}>
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
