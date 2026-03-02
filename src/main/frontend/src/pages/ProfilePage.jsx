import React from 'react';
import './ProfilePage.css';

const ProfilePage = ({ currentUser, onBack }) => {
    return (
        <div className="profile-page">
            <button className="back-btn" onClick={onBack}>&larr; Back</button>

            <div className="profile-card">
                <div className="profile-avatar-large">
                    {currentUser.username.charAt(0).toUpperCase()}
                </div>

                <h2 className="profile-display-name">{currentUser.username}</h2>

                <div className="profile-details">
                    <div className="profile-field">
                        <label>Username</label>
                        <div className="profile-value">{currentUser.username}</div>
                    </div>

                    <div className="profile-field">
                        <label>Email</label>
                        <div className="profile-value">{currentUser.email}</div>
                    </div>
                </div>

                <div className="profile-actions">
                    <button
                        className="change-password-btn"
                        onClick={() => alert('Change password coming soon...')}
                    >
                        Change Password
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
