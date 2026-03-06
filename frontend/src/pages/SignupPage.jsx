import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SignupPage.css';

const SignupPage = () => {
    const navigate = useNavigate();
    const [signupType, setSignupType] = useState('regular'); // 'regular' or 'purdue'
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [status, setStatus] = useState({ loading: false, error: '', success: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    // Verification step state (Purdue flow)
    const [verificationStep, setVerificationStep] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');

    const passwordsMatch = formData.confirmPassword === '' || formData.password === formData.confirmPassword;
    const passwordsTouched = formData.password !== '' && formData.confirmPassword !== '';

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleToggle = (type) => {
        setSignupType(type);
        setStatus({ loading: false, error: '', success: '' });
        setVerificationStep(false);
        setVerificationCode('');
    };

    // Regular signup
    const handleRegularSubmit = async (e) => {
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

            setStatus({ loading: false, error: '', success: 'Account created successfully! Redirecting to login...' });
            setFormData({ username: '', email: '', password: '', confirmPassword: '' });
            setTimeout(() => navigate('/login'), 1500);
        } catch (err) {
            setStatus({ loading: false, error: err.message || 'Failed to connect to server.', success: '' });
        }
    };

    // Purdue step 1: send verification code
    const handleSendVerification = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            setStatus({ loading: false, error: 'Passwords do not match.', success: '' });
            return;
        }
        if (!formData.email.toLowerCase().endsWith('@purdue.edu')) {
            setStatus({ loading: false, error: 'Please enter a valid @purdue.edu email address.', success: '' });
            return;
        }
        setStatus({ loading: true, error: '', success: '' });

        try {
            const response = await fetch('/api/users/send-verification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.email })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to send verification code.');
            }

            setVerificationStep(true);
            setStatus({ loading: false, error: '', success: 'Verification code sent to ' + formData.email });
        } catch (err) {
            setStatus({ loading: false, error: err.message, success: '' });
        }
    };

    // Purdue step 2: verify code + register
    const handleVerifiedRegister = async (e) => {
        e.preventDefault();
        setStatus({ loading: true, error: '', success: '' });

        try {
            const response = await fetch('/api/users/register-verified', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: formData.username,
                    email: formData.email,
                    password: formData.password,
                    code: verificationCode
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Verification failed.');
            }

            setStatus({ loading: false, error: '', success: 'Purdue account verified and created! Redirecting to login...' });
            setTimeout(() => navigate('/login'), 1500);
        } catch (err) {
            setStatus({ loading: false, error: err.message, success: '' });
        }
    };

    return (
        <div className="signup-container">
            <button className="back-btn" onClick={() => navigate('/')}>&larr; Back</button>

            <div className="signup-card">
                <h2 className="signup-title">Create Account</h2>

                {/* Toggle */}
                <div className="signup-toggle">
                    <button
                        className={`toggle-btn ${signupType === 'regular' ? 'active' : ''}`}
                        onClick={() => handleToggle('regular')}
                    >
                        Regular User
                    </button>
                    <button
                        className={`toggle-btn purdue-toggle ${signupType === 'purdue' ? 'active' : ''}`}
                        onClick={() => handleToggle('purdue')}
                    >
                        🅿️ Purdue Student
                    </button>
                </div>

                <p className="signup-subtitle">
                    {signupType === 'regular'
                        ? 'Sign up with any email to get started'
                        : 'Verify your @purdue.edu email for a verified badge'}
                </p>

                {status.error && <div className="alert error">{status.error}</div>}
                {status.success && <div className="alert success">{status.success}</div>}

                {/* Verification code step (Purdue only) */}
                {verificationStep && signupType === 'purdue' ? (
                    <form onSubmit={handleVerifiedRegister} className="signup-form">
                        <div className="verification-info">
                            <p>A 6-digit code was sent to <strong>{formData.email}</strong></p>
                        </div>

                        <div className="input-group">
                            <label htmlFor="verificationCode">Verification Code</label>
                            <input
                                type="text"
                                id="verificationCode"
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value)}
                                required
                                placeholder="e.g. 123456"
                                maxLength={6}
                                className="code-input"
                            />
                        </div>

                        <button type="submit" className="submit-btn" disabled={status.loading}>
                            {status.loading ? 'Verifying...' : 'Verify & Create Account'}
                        </button>

                        <p className="resend-prompt">
                            Didn't get the code?{' '}
                            <span className="resend-link" onClick={handleSendVerification}>Resend</span>
                        </p>
                    </form>
                ) : (
                    /* Main signup form */
                    <form
                        onSubmit={signupType === 'purdue' ? handleSendVerification : handleRegularSubmit}
                        className="signup-form"
                    >
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
                            <label htmlFor="email">
                                {signupType === 'purdue' ? 'Purdue Email' : 'Email'}
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                placeholder={signupType === 'purdue' ? 'student@purdue.edu' : 'you@example.com'}
                            />
                            {signupType === 'purdue' && (
                                <span className="email-hint">Must be a @purdue.edu address</span>
                            )}
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
                                <button type="button" className="toggle-eye" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
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
                                <button type="button" className="toggle-eye" onClick={() => setShowConfirm(!showConfirm)} tabIndex={-1}>
                                    {showConfirm ? '🙈' : '👁️'}
                                </button>
                            </div>
                            {passwordsTouched && !passwordsMatch && (
                                <span className="mismatch-hint">Passwords do not match</span>
                            )}
                        </div>

                        <button type="submit" className="submit-btn" disabled={status.loading}>
                            {status.loading
                                ? (signupType === 'purdue' ? 'Sending Code...' : 'Signing up...')
                                : (signupType === 'purdue' ? 'Send Verification Code' : 'Sign Up')
                            }
                        </button>
                    </form>
                )}

                <p className="login-prompt">
                    Already have an account? <span className="login-link" onClick={() => navigate('/login')}>Log in here</span>
                </p>
            </div>
        </div>
    );
};

export default SignupPage;
