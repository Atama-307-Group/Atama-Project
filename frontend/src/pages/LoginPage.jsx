import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';

const LoginPage = ({ onLoginSuccess }) => {
    const navigate = useNavigate();
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [status, setStatus] = useState({ loading: false, error: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus({ loading: true, error: '' });

        try {
            const response = await fetch('/api/users/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier, password })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Login failed.');
            }

            const data = await response.json();
            onLoginSuccess(data.id, data.username, data.email);
            navigate('/');
        } catch (err) {
            setStatus({ loading: false, error: err.message || 'Failed to connect to server.' });
        }
    };

    return (
        <div className="login-container">
            <button className="back-btn" onClick={() => navigate('/')}>&larr; Back</button>

            <div className="login-card">
                <h2 className="login-title">Welcome Back</h2>
                <p className="login-subtitle">Log in with your username or email</p>

                {status.error && <div className="alert error">{status.error}</div>}

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="input-group">
                        <label htmlFor="identifier">Username or Email</label>
                        <input
                            type="text"
                            id="identifier"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            required
                            placeholder="username or student@purdue.edu"
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="login-password">Password</label>
                        <div className="password-wrapper">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="login-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                className="toggle-eye"
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex={-1}
                                aria-label="Toggle password visibility"
                            >
                                {showPassword ? '🙈' : '👁️'}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="submit-btn"
                        disabled={status.loading}
                    >
                        {status.loading ? 'Logging in...' : 'Log In'}
                    </button>
                </form>

                <p className="signup-prompt">
                    Don't have an account? <span className="signup-link" onClick={() => navigate('/signup')}>Sign up here</span>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
