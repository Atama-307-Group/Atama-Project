import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const PracticeTestPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Safely get settings from state
  const { promptType, cards, numQuestions } = location.state || { promptType: 'term', cards: [], numQuestions: 0 };

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (!cards || cards.length === 0) return;

    const shuffled = [...cards].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, numQuestions);

    const questionSet = selected.map((card) => {
      const incorrectChoices = cards
          .filter((c) => c.id !== card.id)
          .sort(() => 0.5 - Math.random())
          .slice(0, 3);

      const choices = promptType === 'term'
          ? [card.definition, ...incorrectChoices.map((c) => c.definition)]
          : [card.term, ...incorrectChoices.map((c) => c.term)];

      return {
        prompt: promptType === 'term' ? card.term : card.definition,
        correctAnswer: choices[0],
        choices: choices.sort(() => 0.5 - Math.random()),
      };
    });
    setQuestions(questionSet);
  }, [cards, promptType, numQuestions]);

  if (questions.length === 0) {
    return (
        <div style={{ textAlign: 'center', marginTop: '100px' }}>
          <h2>Loading Test or No Data Found...</h2>
          <button onClick={() => navigate('/')}>Go Back</button>
        </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  const handleSubmit = () => {
    if (selectedAnswer === currentQuestion.correctAnswer) setScore(s => s + 1);
    setShowFeedback(true);
  };

  const handleNext = () => {
    if (currentIndex === questions.length - 1) {
      navigate('/post_test', { state: { correct: score, total: questions.length } });
    } else {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
    }
  };

  return (
      <div style={{ maxWidth: '600px', margin: '50px auto', textAlign: 'center' }}>
        <h2>Question {currentIndex + 1} of {questions.length}</h2>
        <div style={{ padding: '30px', border: '1px solid #ccc', borderRadius: '10px', margin: '20px 0' }}>
          <h1>{currentQuestion.prompt}</h1>
        </div>
        <div style={{ display: 'grid', gap: '10px' }}>
          {currentQuestion.choices.map((choice, i) => (
              <button
                  key={i}
                  onClick={() => !showFeedback && setSelectedAnswer(choice)}
                  style={{
                    padding: '15px',
                    backgroundColor: showFeedback
                        ? (choice === currentQuestion.correctAnswer ? '#d4edda' : (choice === selectedAnswer ? '#f8d7da' : '#fff'))
                        : (selectedAnswer === choice ? '#e2e3e5' : '#fff'),
                    cursor: showFeedback ? 'default' : 'pointer'
                  }}
              >
                {choice}
              </button>
          ))}
        </div>
        {!showFeedback ? (
            <button onClick={handleSubmit} disabled={!selectedAnswer} style={{ marginTop: '20px', padding: '10px 30px' }}>Submit</button>
        ) : (
            <button onClick={handleNext} style={{ marginTop: '20px', padding: '10px 30px' }}>Next</button>
        )}
      </div>
  );
};

export default PracticeTestPage;