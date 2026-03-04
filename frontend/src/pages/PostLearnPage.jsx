import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './PostLearnPage.css';

const PostLearnPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { studiedCount, totalCount } = location.state || { studiedCount: 0, totalCount: 0 };

    return (
        <div className="postlearn-container">
            <h1>Well Done!</h1>
            <p>
                You studied <strong>{studiedCount}</strong> out of{' '}
                <strong>{totalCount}</strong> cards.
            </p>
            <button className="restart-button" onClick={() => navigate('/')}>
                Back to Flashcards
            </button>
        </div>
    );
};

export default PostLearnPage;