import React from 'react';

const PostTestPage = ({ correct, total, onRestart }) => {
  const percentage = Math.round((correct / total) * 100);

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Test Complete!</h1>
      <p>You got {correct} out of {total} correct ({percentage}%).</p>
      <button onClick={onRestart}>Back to Flashcards</button>
    </div>
  );
};

export default PostTestPage;