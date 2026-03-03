import React, { useState } from 'react';
import './ForgotPasswordPage.css';

const ForgotPasswordPage = ({ onBack, onGoToReset }) => {
    const [identifier, setIdentifier] = useState('');
    const [status, setStatus] = useState({ loading: false, error: '', success: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus({ loading: true, error: '', success: '' });

        try {
            const response = await fetch('/api/users/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to send reset code.');
            }

            const data = await response.json();
            setStatus({ loading: false, error: '', success: data.message });
        } catch (err) {
            setStatus({ loading: false, error: err.message || 'Something went wrong.', success: '' });
        }
    };

    return (
        <div className="forgot-pw-container">
            <button className="back-btn" onClick={onBack}>&larr; Back</button>

            <div className="forgot-pw-card">
                <h2 className="forgot-pw-title">Forgot Password</h2>
                <p className="forgot-pw-subtitle">
                    Enter your username or email address below. We'll send you a <strong>6-digit reset code</strong> to
                    the email associated with your account. You'll need this code to set a new password.
                </p>

                {status.error && <div className="alert error">{status.error}</div>}
                {status.success && (
                    <div className="alert success">
                        {status.success}
                        <p className="success-hint">
                            Check your email (or the server console for local dev) for the code,
                            then click the link below to reset your password.
                        </p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="forgot-pw-form">
                    <div className="input-group">
                        <label htmlFor="forgot-identifier">Username or Email</label>
                        <input
                            type="text"
                            id="forgot-identifier"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            required
                            placeholder="username or student@purdue.edu"
                        />
                    </div>

                    <button
                        type="submit"
                        className="submit-btn"
                        disabled={status.loading}
                    >
                        {status.loading ? 'Sending...' : 'Send Reset Code'}
                    </button>
                </form>

                {status.success && (
                    <p className="reset-link-prompt">
                        Already have your code? <span className="reset-link" onClick={onGoToReset}>Reset your password here</span>
                    </p>
                )}
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
