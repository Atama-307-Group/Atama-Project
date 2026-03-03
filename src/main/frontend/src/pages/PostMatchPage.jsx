import React from 'react';

const PostMatchPage = ({ attempts, time, onRestart }) => {
  return (
    <div style={{ textAlign: 'center', marginTop: '100px' }}>
      <h1>Well Done!</h1>
      <p>You completed all matches!</p>
      <h2>{attempts} attempts</h2>
      <h2>{time} seconds</h2>

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