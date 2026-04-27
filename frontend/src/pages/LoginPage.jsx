import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { loginUser } from '../api.js';
import './LoginPage.css';

const LoginPage = ({ onLoginSuccess }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [status, setStatus] = useState({ loading: false, error: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus({ loading: true, error: '' });

        try {
            const data = await loginUser({ identifier, password });
            console.log("login data:", data); // confirm isAdmin is true here

            onLoginSuccess(data.id, data.username, data.email, data.profilePictureUrl, data.verified, data.isAdmin, data.aiDisabled, data.recommendationsEnabled, data.darkMode);

            if (data.isAdmin) {
                navigate('/admin');
            } else {
                const destination = location.state?.from || '/';
                navigate(destination);
            }
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
                <p className="forgot-prompt">
                    <span className="forgot-link" onClick={() => navigate('/forgot-password')}>Forgot Password?</span>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
