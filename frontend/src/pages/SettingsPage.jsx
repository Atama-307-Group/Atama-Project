import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ProfilePage from './ProfilePage.jsx';
import { updateAiDisabled, updateRecommendationsEnabled, updateDarkMode } from '../api.js';
import './SettingsPage.css';

const AppPreferencesTab = ({ currentUser, aiDisabled, recommendationsEnabled, onAiDisabledChange, onRecsEnabledChange, darkMode, onDarkModeChange }) => {
    const [saving, setSaving] = useState(false);
    const [savingDark, setSavingDark] = useState(false);

    const handleToggleAi = async () => {
        const newVal = !aiDisabled;
        setSaving(true);
        try {
            await updateAiDisabled(currentUser.id, newVal);
            onAiDisabledChange(newVal);
        } catch (err) {
            console.error("Failed to save AI setting", err);
        } finally {
            setSaving(false);
        }
    };

    const handleToggleRecs = async () => {
        const newVal = !recommendationsEnabled;
        setSaving(true);
        try {
            await updateRecommendationsEnabled(currentUser.id, newVal);
            onRecsEnabledChange(newVal);
        } catch (err) {
            console.error("Failed to save recommendation setting", err);
        } finally {
            setSaving(false);
        }
    };

    const handleDarkToggle = async () => {
        const newVal = !darkMode;
        setSavingDark(true);
        try {
            await updateDarkMode(currentUser.id, newVal);
            onDarkModeChange(newVal);
        } catch (err) {
            console.error("Failed to save dark mode setting", err);
        } finally {
            setSavingDark(false);
        }
    };

    const containerStyle = {
        border: '1px solid #e0e0e0',
        borderRadius: '12px',
        padding: '20px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff'
    };

    const toggleStyle = (active) => ({
        width: '52px',
        height: '28px',
        borderRadius: '14px',
        backgroundColor: active ? '#2b5c3f' : '#ccc',
        position: 'relative',
        cursor: saving ? 'not-allowed' : 'pointer',
        transition: 'background-color 0.2s',
        flexShrink: 0,
    });

    const knobStyle = (active) => ({
        position: 'absolute',
        top: '3px',
        left: active ? '27px' : '3px',
        width: '22px',
        height: '22px',
        borderRadius: '50%',
        backgroundColor: 'white',
        boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
        transition: 'left 0.2s ease',
        pointerEvents: 'none',
    });

    return (
        <div style={{ maxWidth: '800px', margin: '0', padding: '0 20px', fontFamily: 'sans-serif', width: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* AI Toggle */}
                <div style={containerStyle}>
                    <div>
                        <p style={{ fontWeight: '600', margin: 0, color: '#1a3c27' }}>Disable AI Features</p>
                        <p style={{ color: '#888', fontSize: '14px', margin: '4px 0 0' }}>
                            Turn off AI-powered generation across the app.
                        </p>
                    </div>
                    <div onClick={saving ? undefined : handleToggleAi} style={toggleStyle(aiDisabled)}>
                        <div style={knobStyle(aiDisabled)} />
                    </div>
                </div>

                {/* Recommendations Toggle */}
                <div style={containerStyle}>
                    <div>
                        <p style={{ fontWeight: '600', margin: 0, color: '#1a3c27' }}>Smart Recommendations</p>
                        <p style={{ color: '#888', fontSize: '14px', margin: '4px 0 0' }}>
                            Show personalized study suggestions on your dashboard.
                        </p>
                    </div>
                    <div onClick={saving ? undefined : handleToggleRecs} style={toggleStyle(recommendationsEnabled)}>
                        <div style={knobStyle(recommendationsEnabled)} />
                    </div>
                </div>

                {/* Dark Mode Toggle */}
                <div style={containerStyle}>
                    <div>
                        <p style={{ fontWeight: '600', margin: 0, color: '#1a3c27' }}>Dark Mode</p>
                        <p style={{ color: '#888', fontSize: '14px', margin: '4px 0 0' }}>
                            Toggle dark/light mode for the application.
                        </p>
                    </div>
                    <div onClick={savingDark ? undefined : handleDarkToggle} style={toggleStyle(darkMode)}>
                        <div style={knobStyle(darkMode)} />
                    </div>
                </div>
            </div>
        </div>
    );
};

const SettingsPage = ({ currentUser, aiDisabled, recommendationsEnabled, onAiDisabledChange, onRecsEnabledChange, darkMode, onDarkModeChange }) => {
    const navigate = useNavigate();
    const location = useLocation();
    
    // Parse tab from URL if present. E.g., /settings?tab=preferences
    const searchParams = new URLSearchParams(location.search);
    const initialTab = searchParams.get('tab') || 'profile';
    const [activeTab, setActiveTab] = useState(initialTab);

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        navigate(`/settings?tab=${tab}`, { replace: true });
    };

    return (
        <div className="settings-page-layout">
            <div className="settings-container">
                <div className="settings-sidebar">
                    <div className="settings-sidebar-header">
                        <button className="settings-back-arrow" onClick={() => navigate('/')}>
                            &larr;
                        </button>
                        <h1 className="settings-title">Settings</h1>
                    </div>
                    <ul className="settings-menu">
                        <li 
                            className={`settings-menu-item ${activeTab === 'profile' ? 'active' : ''}`}
                            onClick={() => handleTabChange('profile')}
                        >
                            Profile
                        </li>
                        <li 
                            className={`settings-menu-item ${activeTab === 'preferences' ? 'active' : ''}`}
                            onClick={() => handleTabChange('preferences')}
                        >
                            App preferences
                        </li>
                    </ul>
                </div>
                
                <div className="settings-content">
                    {activeTab === 'profile' && <ProfilePage currentUser={currentUser} />}
                    {activeTab === 'preferences' && (
                        <AppPreferencesTab 
                            currentUser={currentUser}
                            aiDisabled={aiDisabled}
                            recommendationsEnabled={recommendationsEnabled}
                            onAiDisabledChange={onAiDisabledChange}
                            onRecsEnabledChange={onRecsEnabledChange}
                            darkMode={darkMode}
                            onDarkModeChange={onDarkModeChange}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
