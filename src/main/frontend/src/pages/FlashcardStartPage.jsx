import React from 'react';

const FlashcardStartPage = ({ onStart }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
      }}
    >
      <h1>Flashcard Set Title</h1>

      {/* Buttons side by side */}
      <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
        <button
          onClick={onStart}
          style={{
            padding: '10px 20px',
            fontSize: '18px',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
        >
          Study
        </button>
        <button
          onClick={() => alert('Match soon...')}
          style={{
            padding: '10px 20px',
            fontSize: '18px',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
        >
          Match
        </button>

        <button
          onClick={() => alert('Practice Test soon...')}
          style={{
            padding: '10px 20px',
            fontSize: '18px',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
        >
          Practice Test
        </button>

        <button
          onClick={() => alert('Other cool feature soon...')}
          style={{
            padding: '10px 20px',
            fontSize: '18px',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
        >
          Other cool feature
        </button>
      </div>
    </div>
  );
};

export default FlashcardStartPage;