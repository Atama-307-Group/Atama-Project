import React from 'react';
import './PostLearnPage.css';

const PostLearnPage = ({ studiedCount, totalCount, onRestart }) => {
  return (
    <div className="postlearn-container">
      <h1>Well Done!</h1>
      <p>
        You studied <strong>{studiedCount}</strong> out of{' '}
        <strong>{totalCount}</strong> cards.
      </p>

      <button className="restart-button" onClick={onRestart}>
        Back to Flashcards
      </button>
    </div>
  );
};

export default PostLearnPage;