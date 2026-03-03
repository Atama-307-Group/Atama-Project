import React from 'react';

const FlashcardStartPage = ({ onLearn, onPracticeTest, onMatch }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        textAlign: 'center'
      }}
    >
      <h1>Flashcard Set Title</h1>

      <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
        <button
          onClick={onLearn}
          style={{ padding: '10px 20px', fontSize: '18px', borderRadius: '5px', cursor: 'pointer' }}
        >
          Learn
        </button>

        <button
          onClick={onMatch}
          style={{ padding: '10px 20px', fontSize: '18px', borderRadius: '5px', cursor: 'pointer' }}
        >
          Match
        </button>

        <button
          onClick={onPracticeTest}
          style={{ padding: '10px 20px', fontSize: '18px', borderRadius: '5px', cursor: 'pointer' }}
        >
          Practice Test
        </button>

        <button
          onClick={() => alert('Other feature coming soon!')}
          style={{ padding: '10px 20px', fontSize: '18px', borderRadius: '5px', cursor: 'pointer' }}
        >
          Other Feature
        </button>
      </div>
    </div>
  );
};

export default FlashcardStartPage;