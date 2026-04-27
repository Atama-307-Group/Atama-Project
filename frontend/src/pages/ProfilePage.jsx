import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ProfilePage.css';

const ProfilePage = ({ currentUser }) => {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    // Profile picture state
    const [profilePic, setProfilePic] = useState(currentUser.profilePictureUrl || null);
    const [picStatus, setPicStatus] = useState({ loading: false, error: '', success: '' });

    // Change username state
    const [showUsernameModal, setShowUsernameModal] = useState(false);
    const [newUsername, setNewUsername] = useState('');
    const [usernamePassword, setUsernamePassword] = useState('');
    const [usernameStatus, setUsernameStatus] = useState({ loading: false, error: '', success: '' });

    // Delete account state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [deleteStatus, setDeleteStatus] = useState({ loading: false, error: '' });
    const [deleteDataOption, setDeleteDataOption] = useState('delete');


    // Load profile picture on mount
    useEffect(() => {
        const fetchProfilePic = async () => {
            try {
                const res = await fetch(`/api/users/${currentUser.id}/profile-picture`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.profilePictureUrl) {
                        setProfilePic(data.profilePictureUrl);
                        // Update localStorage too
                        const saved = JSON.parse(localStorage.getItem('currentUser') || '{}');
                        saved.profilePictureUrl = data.profilePictureUrl;
                        localStorage.setItem('currentUser', JSON.stringify(saved));
                    }
                }
            } catch (err) {
                // Silently fail — just use the initial letter
            }
        };
        fetchProfilePic();
    }, [currentUser.id]);

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type and size
        if (!file.type.startsWith('image/')) {
            setPicStatus({ loading: false, error: 'Please select an image file.', success: '' });
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            setPicStatus({ loading: false, error: 'Image must be under 2MB.', success: '' });
            return;
        }

        setPicStatus({ loading: true, error: '', success: '' });

        // Read file as Base64
        const reader = new FileReader();
        reader.onload = async (event) => {
            const base64 = event.target.result;
            try {
                const res = await fetch(`/api/users/${currentUser.id}/upload-profile-picture`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ profilePictureUrl: base64 })
                });

                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.message || 'Upload failed.');
                }

                setProfilePic(base64);
                // Update localStorage
                const saved = JSON.parse(localStorage.getItem('currentUser') || '{}');
                saved.profilePictureUrl = base64;
                localStorage.setItem('currentUser', JSON.stringify(saved));

                setPicStatus({ loading: false, error: '', success: 'Profile picture updated!' });
                setTimeout(() => setPicStatus(s => ({ ...s, success: '' })), 2000);
            } catch (err) {
                setPicStatus({ loading: false, error: err.message, success: '' });
            }
        };
        reader.readAsDataURL(file);
    };

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
                body: JSON.stringify({ password: deletePassword, dataOption: deleteDataOption })
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
                {/* Avatar */}
                <div className="profile-avatar-wrapper">
                    {profilePic ? (
                        <img src={profilePic} alt="Profile" className="profile-avatar-img" />
                    ) : (
                        <div className="profile-avatar-large">
                            {currentUser.username.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                    />
                </div>
                <span className="change-pic-link" onClick={handleAvatarClick}>Change Profile Picture</span>
                {picStatus.loading && <p className="pic-status loading">Uploading...</p>}
                {picStatus.error && <p className="pic-status error">{picStatus.error}</p>}
                {picStatus.success && <p className="pic-status success">{picStatus.success}</p>}

                <h2 className="profile-display-name">{currentUser.username}</h2>

                {currentUser.verified && (
                    <div className="purdue-badge">
                        <span className="purdue-p">P</span>
                        <span>Verified Purdue Student</span>
                    </div>
                )}

                <div className="profile-details">
                    <div className="profile-field">
                        <label>Username</label>
                        <div className="profile-value">{currentUser.username}</div>
                    </div>

                    <div className="profile-field">
                        <label>Email</label>
                        <div className="profile-value">{currentUser.email}</div>
                    </div>

                    <div className="profile-field">
                        <label>Status</label>
                        <div className="profile-value">
                            {currentUser.verified ? (
                                <span className="verified-text">✅ Verified Purdue Student</span>
                            ) : (
                                <span className="unverified-text">Standard User</span>
                            )}
                        </div>
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
                        <p className="modal-subtitle">This action is <strong>permanent</strong> and cannot be undone. First, choose what happens to your content.</p>

                        {deleteStatus.error && <div className="alert error">{deleteStatus.error}</div>}

                        <form onSubmit={handleDeleteAccount}>
                            <div className="delete-options">
                                <label className={`delete-option ${deleteDataOption === 'delete' ? 'selected' : ''}`}>
                                    <input
                                        type="radio"
                                        name="dataOption"
                                        value="delete"
                                        checked={deleteDataOption === 'delete'}
                                        onChange={() => setDeleteDataOption('delete')}
                                    />
                                    <div>
                                        <div className="option-title">Delete all my content</div>
                                        <div className="option-desc">Permanently removes all uploaded course materials and personal library items (e.g. flashcard sets).</div>
                                    </div>
                                </label>

                                <label className={`delete-option ${deleteDataOption === 'transfer' ? 'selected' : ''}`}>
                                    <input
                                        type="radio"
                                        name="dataOption"
                                        value="transfer"
                                        checked={deleteDataOption === 'transfer'}
                                        onChange={() => setDeleteDataOption('transfer')}
                                    />
                                    <div>
                                        <div className="option-title">Move to Atama Anonymous</div>
                                        <div className="option-desc">Transfers all uploaded course materials and personal library items to the shared anonymous account.</div>
                                    </div>
                                </label>
                            </div>

                            <div className="input-group">
                                <label>Confirm with your password</label>
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
