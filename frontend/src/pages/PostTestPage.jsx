import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const PostTestPage = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // Pull the results from the state object
    const { correct, total } = location.state || { correct: 0, total: 0 };

    // Calculate percentage, handling division by zero just in case
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

    // Determine a color based on performance
    const getScoreColor = () => {
        if (percentage >= 80) return '#2e7d32'; // Green
        if (percentage >= 50) return '#f57c00'; // Orange
        return '#d32f2f'; // Red
    };

    return (
        <div style={{
            textAlign: 'center',
            marginTop: '100px',
            fontFamily: 'sans-serif',
            padding: '20px'
        }}>
            <h1 style={{ fontSize: '3rem', marginBottom: '10px' }}>Test Complete!</h1>

            <div style={{
                fontSize: '1.5rem',
                margin: '20px 0',
                padding: '20px',
                borderRadius: '10px',
                backgroundColor: '#f5f5f5',
                display: 'inline-block'
            }}>
                <p>You got <span style={{ fontWeight: 'bold' }}>{correct}</span> out of <span style={{ fontWeight: 'bold' }}>{total}</span> correct.</p>
                <h2 style={{
                    fontSize: '4rem',
                    margin: '10px 0',
                    color: getScoreColor()
                }}>
                    {percentage}%
                </h2>
            </div>

            <div style={{ marginTop: '30px' }}>
                <button
                    onClick={() => navigate('/')}
                    style={{
                        padding: '12px 30px',
                        fontSize: '18px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        backgroundColor: '#333',
                        color: 'white',
                        border: 'none'
                    }}
                >
                    Back to Flashcards
                </button>
            </div>
        </div>
    );
};

export default PostTestPage;