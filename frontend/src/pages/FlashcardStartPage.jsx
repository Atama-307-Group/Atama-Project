import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateSharedLink } from '../api.js';
import './FlashcardStartPage.css';

const FlashcardStartPage = ({ currentUser, onLogout }) => {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);


  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="start-page">
      {/* Top-right corner: auth buttons or profile */}
      <div className="top-bar">
        {currentUser ? (
          <div className="profile-section" ref={dropdownRef}>
            <div
              className="profile-trigger"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              {currentUser.profilePictureUrl ? (
                <img src={currentUser.profilePictureUrl} alt="" className="avatar-img" />
              ) : (
                <div className="avatar">
                  {currentUser.username.charAt(0).toUpperCase()}
                </div>
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
                    <div className="dropdown-avatar">
                      {currentUser.username.charAt(0).toUpperCase()}
                    </div>
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
            <button className="auth-btn signup-btn" onClick={() => navigate('/signup')}>
              Sign Up
            </button>
            <button className="auth-btn login-btn" onClick={() => navigate('/login')}>
              Log In
            </button>
          </div>
        )}
      </div>


      {/* Main content */}
      <div className="start-content">
        <h1>Study with Atama</h1>
        <div className="action-buttons">
          <button className="action-btn" onClick={() => navigate('/create')}>
            Create New Set
          </button>

          {/* Changed from /study/term to match your PreLearn route */}
          <button className="action-btn" onClick={() => navigate('/pre_learn')}>
            Study
          </button>

          {/* Replaced alert with actual navigation */}
          <button className="action-btn" onClick={() => navigate('/pre_match')}>
            Match
          </button>

          {/* Replaced alert with actual navigation */}
          <button className="action-btn" onClick={() => navigate('/pre_test')}>
            Practice Test
          </button>

          <button className="action-btn" onClick={() => navigate('/folders')}>
            Library
          </button>
        </div>
      </div>
    </div>
  );
};

export default FlashcardStartPage;