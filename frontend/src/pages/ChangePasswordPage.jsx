import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ChangePasswordPage.css';

const ChangePasswordPage = ({ currentUser }) => {
    const navigate = useNavigate();
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showOld, setShowOld] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [status, setStatus] = useState({ loading: false, error: '', success: '' });

    const passwordsMatch = confirmPassword === '' || newPassword === confirmPassword;
    const passwordsTouched = newPassword !== '' && confirmPassword !== '';

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            setStatus({ loading: false, error: 'New passwords do not match.', success: '' });
            return;
        }

        if (newPassword.length < 6) {
            setStatus({ loading: false, error: 'New password must be at least 6 characters.', success: '' });
            return;
        }

        setStatus({ loading: true, error: '', success: '' });

        try {
            const response = await fetch(`/api/users/${currentUser.id}/change-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ oldPassword, newPassword })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to change password.');
            }

            setStatus({ loading: false, error: '', success: 'Password changed successfully! Redirecting...' });
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => navigate('/settings'), 1000);
        } catch (err) {
            setStatus({ loading: false, error: err.message || 'Something went wrong.', success: '' });
        }
    };

    return (
        <div className="change-pw-container">
            <button className="back-btn" onClick={() => navigate('/settings')}>&larr; Back</button>

            <div className="change-pw-card">
                <h2 className="change-pw-title">Change Password</h2>
                <p className="change-pw-subtitle">Enter your current password and choose a new one</p>

                {status.error && <div className="alert error">{status.error}</div>}
                {status.success && <div className="alert success">{status.success}</div>}

                <form onSubmit={handleSubmit} className="change-pw-form">
                    <div className="input-group">
                        <label htmlFor="old-password">Current Password</label>
                        <div className="password-wrapper">
                            <input
                                type={showOld ? 'text' : 'password'}
                                id="old-password"
                                value={oldPassword}
                                onChange={(e) => setOldPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                className="toggle-eye"
                                onClick={() => setShowOld(!showOld)}
                                tabIndex={-1}
                            >
                                {showOld ? '🙈' : '👁️'}
                            </button>
                        </div>
                    </div>

                    <div className={`input-group ${passwordsTouched && !passwordsMatch ? 'input-error' : ''}`}>
                        <label htmlFor="new-password">New Password</label>
                        <div className="password-wrapper">
                            <input
                                type={showNew ? 'text' : 'password'}
                                id="new-password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                className="toggle-eye"
                                onClick={() => setShowNew(!showNew)}
                                tabIndex={-1}
                            >
                                {showNew ? '🙈' : '👁️'}
                            </button>
                        </div>
                    </div>

                    <div className={`input-group ${passwordsTouched && !passwordsMatch ? 'input-error' : ''}`}>
                        <label htmlFor="confirm-new-password">Confirm New Password</label>
                        <div className="password-wrapper">
                            <input
                                type={showConfirm ? 'text' : 'password'}
                                id="confirm-new-password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                className="toggle-eye"
                                onClick={() => setShowConfirm(!showConfirm)}
                                tabIndex={-1}
                            >
                                {showConfirm ? '🙈' : '👁️'}
                            </button>
                        </div>
                        {passwordsTouched && !passwordsMatch && (
                            <span className="mismatch-hint">Passwords do not match</span>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="submit-btn"
                        disabled={status.loading}
                    >
                        {status.loading ? 'Changing...' : 'Change Password'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChangePasswordPage;
