import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const PostMatchPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { attempts, time } = location.state || { attempts: 0, time: 0 };

    return (
        <div style={{ textAlign: 'center', marginTop: '100px' }}>
            <h1>Well Done!</h1>
            <p>You completed all matches!</p>
            <h2>{attempts} attempts</h2>
            <h2>{time} seconds</h2>
            <button onClick={() => navigate('/')} style={{ padding: '10px 20px', cursor: 'pointer' }}>
                Return Home
            </button>
        </div>
    );
};

export default PostMatchPage;