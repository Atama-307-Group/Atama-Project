import React from 'react';

const FlashcardStartPage = ({ onStart, onCreate }) => {
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
          onClick={onCreate}
          style={{
            padding: '10px 20px',
            fontSize: '18px',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
        >
          Create New Set
        </button>
        <button
          onClick={onStart} // TODO: should probably change url when navigating pages
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

      </div>
    </div>
  );
};

export default FlashcardStartPage;