import React, { useState, useEffect } from 'react';

const PracticeTestPage = ({ promptType, cards, numQuestions, onDone }) => {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);

  // Generate questions on mount
  useEffect(() => {
    const shuffled = [...cards].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, Math.min(numQuestions, cards.length));

    const questionSet = selected.map((card) => {
      // create choices: correct + up to 3 incorrect
      const incorrectChoices = cards
        .filter((c) => c !== card)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);

      const choices =
        promptType === 'term'
          ? [card.definition, ...incorrectChoices.map((c) => c.definition)]
          : [card.term, ...incorrectChoices.map((c) => c.term)];

      return {
        prompt: promptType === 'term' ? card.term : card.definition,
        correctAnswer: choices[0],
        choices: choices.sort(() => 0.5 - Math.random()), // shuffle choices
      };
    });

    setQuestions(questionSet);
  }, [cards, promptType, numQuestions]);

  if (questions.length === 0) {
    return <div>No questions available.</div>;
  }

  const currentQuestion = questions[currentIndex];

  const handleSubmit = () => {
    if (selectedAnswer === null) return;

    // update score if correct
    if (selectedAnswer === currentQuestion.correctAnswer) {
      setScore((prev) => prev + 1);
    }

    setShowFeedback(true);
  };

  const handleNext = () => {
    setSelectedAnswer(null);
    setShowFeedback(false);

    if (currentIndex === questions.length - 1) {
      // last question, finish test
      onDone(score, questions.length);
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '50px auto', fontFamily: 'sans-serif', textAlign: 'center' }}>
      <h2>Question {currentIndex + 1} / {questions.length}</h2>
      <p style={{ fontWeight: 'bold', fontSize: '18px' }}>{currentQuestion.prompt}</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
        {currentQuestion.choices.map((choice, idx) => (
          <button
            key={idx}
            onClick={() => !showFeedback && setSelectedAnswer(choice)}
            style={{
              padding: '10px',
              borderRadius: '5px',
              border: selectedAnswer === choice ? '2px solid #333' : '1px solid #ccc',
              backgroundColor: showFeedback
                ? choice === currentQuestion.correctAnswer
                  ? 'lightgreen'
                  : choice === selectedAnswer
                  ? 'lightcoral'
                  : 'white'
                : 'white',
              cursor: showFeedback ? 'default' : 'pointer',
            }}
          >
            {choice}
          </button>
        ))}
      </div>

      {!showFeedback && (
        <button
          onClick={handleSubmit}
          style={{ marginTop: '20px', padding: '10px 20px', fontSize: '16px', borderRadius: '5px', cursor: 'pointer' }}
          disabled={selectedAnswer === null}
        >
          Submit
        </button>
      )}

      {showFeedback && (
        <div style={{ marginTop: '20px' }}>
          {selectedAnswer === currentQuestion.correctAnswer ? (
            <p style={{ color: 'green', fontWeight: 'bold' }}>Correct!</p>
          ) : (
            <p style={{ color: 'red', fontWeight: 'bold' }}>
              Wrong! Correct answer: {currentQuestion.correctAnswer}
            </p>
          )}
          <button
            onClick={handleNext}
            style={{ marginTop: '10px', padding: '10px 20px', fontSize: '16px', borderRadius: '5px', cursor: 'pointer' }}
          >
            {currentIndex === questions.length - 1 ? 'Finish Test' : 'Next Question'}
          </button>
        </div>
      )}
    </div>
  );
};

export default PracticeTestPage;