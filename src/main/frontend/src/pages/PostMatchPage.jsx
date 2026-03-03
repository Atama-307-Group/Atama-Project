import React from 'react';

const PostMatchPage = ({ attempts, onRestart }) => {
  return (
    <div style={{ textAlign: 'center', marginTop: '100px' }}>
      <h1>Well Done!</h1>
      <p>
        You completed all matches in <strong>{attempts}</strong> attempts.
      </p>
      <button
        onClick={onRestart}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          borderRadius: '5px',
          cursor: 'pointer',
        }}
      >
        Return
      </button>
    </div>
  );
};

export default PostMatchPage;