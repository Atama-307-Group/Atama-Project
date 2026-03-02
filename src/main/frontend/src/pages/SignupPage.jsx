import React, { useState } from 'react';
import './SignupPage.css';

const SignupPage = ({ onBack, onLoginClick }) => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [status, setStatus] = useState({ loading: false, error: '', success: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const passwordsMatch = formData.confirmPassword === '' || formData.password === formData.confirmPassword;
    const passwordsTouched = formData.password !== '' && formData.confirmPassword !== '';

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            setStatus({ loading: false, error: 'Passwords do not match.', success: '' });
            return;
        }
        setStatus({ loading: true, error: '', success: '' });

        try {
            const { confirmPassword, ...submitData } = formData;
            const response = await fetch('/api/users/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(submitData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Registration failed.');
            }

            setStatus({ loading: false, error: '', success: 'Account created successfully! Please log in.' });
            setFormData({ username: '', email: '', password: '', confirmPassword: '' });
        } catch (err) {
            setStatus({ loading: false, error: err.message || 'Failed to connect to server.', success: '' });
        }
    };

    return (
        <div className="signup-container">
            <button className="back-btn" onClick={onBack}>&larr; Back</button>

            <div className="signup-card">
                <h2 className="signup-title">Create Account</h2>
                <p className="signup-subtitle">Enter your university email to get started</p>

                {status.error && <div className="alert error">{status.error}</div>}
                {status.success && <div className="alert success">{status.success}</div>}

                <form onSubmit={handleSubmit} className="signup-form">
                    <div className="input-group">
                        <label htmlFor="username">Username</label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                            placeholder="e.g. purdue_student"
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="email">University Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            placeholder="student@purdue.edu"
                        />
                    </div>

                    <div className={`input-group ${passwordsTouched && !passwordsMatch ? 'input-error' : ''}`}>
                        <label htmlFor="password">Password</label>
                        <div className="password-wrapper">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
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

                    <div className={`input-group ${passwordsTouched && !passwordsMatch ? 'input-error' : ''}`}>
                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <div className="password-wrapper">
                            <input
                                type={showConfirm ? 'text' : 'password'}
                                id="confirmPassword"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                className="toggle-eye"
                                onClick={() => setShowConfirm(!showConfirm)}
                                tabIndex={-1}
                                aria-label="Toggle confirm password visibility"
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
                        {status.loading ? 'Signing up...' : 'Sign Up'}
                    </button>
                </form>

                <p className="login-prompt">
                    Already have an account? <span className="login-link" onClick={onLoginClick}>Log in here</span>
                </p>
            </div>
        </div>
    );
};

export default SignupPage;
