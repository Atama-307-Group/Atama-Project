import React from 'react';
import { useNavigate } from 'react-router-dom';

const AiDisabledModal = ({ onClose }) => {
    const navigate = useNavigate();

    return (
        <div style={{
            position: 'fixed', inset: 0,
            backgroundColor: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999,
        }}>
            <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '32px',
                maxWidth: '380px',
                width: '90%',
                textAlign: 'center',
                boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            }}>
                <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🤖</div>
                <h2 style={{ margin: '0 0 12px', fontSize: '1.2rem' }}>AI Features Disabled</h2>
                <p style={{ color: '#555', lineHeight: '1.6', margin: '0 0 24px' }}>
                    You have disabled AI features. Go to{' '}
                    <span
                        onClick={() => { onClose(); navigate('/settings'); }}
                        style={{ color: '#2b5c3f', cursor: 'pointer', fontWeight: '600', textDecoration: 'underline' }}
                    >
                        Settings
                    </span>
                    {' '}to modify your AI preferences.
                </p>
                <button
                    onClick={onClose}
                    style={{
                        padding: '10px 32px',
                        backgroundColor: '#2b5c3f',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '15px',
                        cursor: 'pointer',
                        fontWeight: '600',
                    }}
                >
                    OK
                </button>
            </div>
        </div>
    );
};

export default AiDisabledModal;