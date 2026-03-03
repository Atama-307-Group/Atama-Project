import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ProfilePage.css';

const ProfilePage = ({ currentUser }) => {
    const navigate = useNavigate();

    // Change username state
    const [showUsernameModal, setShowUsernameModal] = useState(false);
    const [newUsername, setNewUsername] = useState('');
    const [usernamePassword, setUsernamePassword] = useState('');
    const [usernameStatus, setUsernameStatus] = useState({ loading: false, error: '', success: '' });

    // Delete account state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [deleteStatus, setDeleteStatus] = useState({ loading: false, error: '' });

    const handleChangeUsername = async (e) => {
        e.preventDefault();
        setUsernameStatus({ loading: true, error: '', success: '' });

        try {
            const response = await fetch(`/api/users/${currentUser.id}/change-username`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newUsername, password: usernamePassword })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to change username.');
            }

            const data = await response.json();
            // Update localStorage
            const updatedUser = { ...currentUser, username: data.username };
            localStorage.setItem('currentUser', JSON.stringify(updatedUser));

            setUsernameStatus({ loading: false, error: '', success: 'Username changed! Reloading...' });
            setTimeout(() => window.location.reload(), 1000);
        } catch (err) {
            setUsernameStatus({ loading: false, error: err.message, success: '' });
        }
    };

    const handleDeleteAccount = async (e) => {
        e.preventDefault();
        setDeleteStatus({ loading: true, error: '' });

        try {
            const response = await fetch(`/api/users/${currentUser.id}/delete-account`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: deletePassword })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete account.');
            }

            localStorage.removeItem('currentUser');
            navigate('/');
            window.location.reload();
        } catch (err) {
            setDeleteStatus({ loading: false, error: err.message });
        }
    };

    return (
        <div className="profile-page">
            <button className="back-btn" onClick={() => navigate('/')}>&larr; Back</button>

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
                        className="change-username-btn"
                        onClick={() => setShowUsernameModal(true)}
                    >
                        Change Username
                    </button>
                    <button
                        className="change-password-btn"
                        onClick={() => navigate('/change-password')}
                    >
                        Change Password
                    </button>
                    <button
                        className="delete-account-btn"
                        onClick={() => setShowDeleteModal(true)}
                    >
                        Delete Account
                    </button>
                </div>
            </div>

            {/* Change Username Modal */}
            {showUsernameModal && (
                <div className="modal-overlay" onClick={() => setShowUsernameModal(false)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                        <h3 className="modal-title">Change Username</h3>
                        <p className="modal-subtitle">Enter your new username and confirm with your password.</p>

                        {usernameStatus.error && <div className="alert error">{usernameStatus.error}</div>}
                        {usernameStatus.success && <div className="alert success">{usernameStatus.success}</div>}

                        <form onSubmit={handleChangeUsername}>
                            <div className="input-group">
                                <label>New Username</label>
                                <input
                                    type="text"
                                    value={newUsername}
                                    onChange={(e) => setNewUsername(e.target.value)}
                                    required
                                    placeholder="Enter new username"
                                />
                            </div>
                            <div className="input-group">
                                <label>Password</label>
                                <input
                                    type="password"
                                    value={usernamePassword}
                                    onChange={(e) => setUsernamePassword(e.target.value)}
                                    required
                                    placeholder="••••••••"
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="modal-cancel-btn" onClick={() => setShowUsernameModal(false)}>Cancel</button>
                                <button type="submit" className="modal-confirm-btn" disabled={usernameStatus.loading}>
                                    {usernameStatus.loading ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Account Modal */}
            {showDeleteModal && (
                <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
                    <div className="modal-card delete-modal" onClick={(e) => e.stopPropagation()}>
                        <h3 className="modal-title delete-title">⚠️ Delete Account</h3>
                        <p className="modal-subtitle">This action is <strong>permanent</strong> and cannot be undone. Enter your password to confirm.</p>

                        {deleteStatus.error && <div className="alert error">{deleteStatus.error}</div>}

                        <form onSubmit={handleDeleteAccount}>
                            <div className="input-group">
                                <label>Password</label>
                                <input
                                    type="password"
                                    value={deletePassword}
                                    onChange={(e) => setDeletePassword(e.target.value)}
                                    required
                                    placeholder="••••••••"
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="modal-cancel-btn" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                                <button type="submit" className="modal-delete-btn" disabled={deleteStatus.loading}>
                                    {deleteStatus.loading ? 'Deleting...' : 'Delete My Account'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfilePage;
