import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { updateAiDisabled, updateRecommendationsEnabled } from '../api.js';

const SettingsPage = ({ currentUser, aiDisabled, recommendationsEnabled, onAiDisabledChange, onRecsEnabledChange }) => {
    const navigate = useNavigate();
    const [saving, setSaving] = useState(false);

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
        <div style={{ maxWidth: '500px', margin: '60px auto', padding: '0 20px', fontFamily: 'sans-serif' }}>
            <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', marginBottom: '24px' }}>
                ← Back
            </button>
            <h1 style={{ fontSize: '1.8rem', marginBottom: '8px' }}>Settings</h1>
            <p style={{ color: '#666', marginBottom: '32px' }}>Manage your app preferences.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* AI Toggle */}
                <div style={containerStyle}>
                    <div>
                        <p style={{ fontWeight: '600', margin: 0 }}>Disable AI Features</p>
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
                        <p style={{ fontWeight: '600', margin: 0 }}>Smart Recommendations</p>
                        <p style={{ color: '#888', fontSize: '14px', margin: '4px 0 0' }}>
                            Show personalized study suggestions on your dashboard.
                        </p>
                    </div>
                    <div onClick={saving ? undefined : handleToggleRecs} style={toggleStyle(recommendationsEnabled)}>
                        <div style={knobStyle(recommendationsEnabled)} />
                    </div>
                </div>
            </div>
        </div>
    );
};

const containerStyle = {
    border: '1px solid #e0e0e0',
    borderRadius: '12px',
    padding: '20px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
};

export default SettingsPage;