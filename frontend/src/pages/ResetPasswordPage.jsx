import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ResetPasswordPage.css';

const ResetPasswordPage = () => {
    const navigate = useNavigate();
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [status, setStatus] = useState({ loading: false, error: '', success: false });

    const passwordsMatch = confirmPassword === '' || newPassword === confirmPassword;
    const passwordsTouched = newPassword !== '' && confirmPassword !== '';

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            setStatus({ loading: false, error: 'Passwords do not match.', success: false });
            return;
        }

        if (newPassword.length < 6) {
            setStatus({ loading: false, error: 'Password must be at least 6 characters.', success: false });
            return;
        }

        setStatus({ loading: true, error: '', success: false });

        try {
            const response = await fetch('/api/users/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, newPassword })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to reset password.');
            }

            setStatus({ loading: false, error: '', success: true });
        } catch (err) {
            setStatus({ loading: false, error: err.message || 'Something went wrong.', success: false });
        }
    };

    return (
        <div className="reset-pw-container">
            <button className="back-btn" onClick={() => navigate('/forgot-password')}>&larr; Back</button>

            <div className="reset-pw-card">
                <h2 className="reset-pw-title">Reset Password</h2>

                {!status.success ? (
                    <>
                        <p className="reset-pw-subtitle">
                            Enter the 6-digit code from your email and choose a new password.
                        </p>

                        {status.error && <div className="alert error">{status.error}</div>}

                        <form onSubmit={handleSubmit} className="reset-pw-form">
                            <div className="input-group">
                                <label htmlFor="reset-code">Reset Code</label>
                                <input
                                    type="text"
                                    id="reset-code"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    required
                                    placeholder="e.g. 123456"
                                    maxLength={6}
                                    className="code-input"
                                />
                            </div>

                            <div className={`input-group ${passwordsTouched && !passwordsMatch ? 'input-error' : ''}`}>
                                <label htmlFor="reset-new-password">New Password</label>
                                <div className="password-wrapper">
                                    <input
                                        type={showNew ? 'text' : 'password'}
                                        id="reset-new-password"
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
                                <label htmlFor="reset-confirm-password">Confirm New Password</label>
                                <div className="password-wrapper">
                                    <input
                                        type={showConfirm ? 'text' : 'password'}
                                        id="reset-confirm-password"
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
                                {status.loading ? 'Resetting...' : 'Reset Password'}
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="success-section">
                        <div className="success-icon">✅</div>
                        <h3 className="success-heading">Password Reset Successfully!</h3>
                        <p className="success-text">Your password has been updated. You can now log in with your new password.</p>
                        <span className="login-link" onClick={() => navigate('/login')}>Go to Log In</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResetPasswordPage;
