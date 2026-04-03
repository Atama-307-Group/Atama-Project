import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { startStudying, stopStudying, addSetStudyTime } from "../api.js";

const getEditDistance = (a, b) => {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
      }
    }
  }
  return matrix[b.length][a.length];
};

const PracticeTestPage = ({ userId }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const hasStoppedRef = useRef(false);
  const sessionStartRef = useRef(Date.now());

  const { promptType, cards, numQuestions, setId } = location.state || { promptType: 'term', cards: [], numQuestions: 0, setId: null };

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInputs, setUserInputs] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [fuzzyIndices, setFuzzyIndices] = useState([]);
  const [dismissedIndices, setDismissedIndices] = useState([]);

  useEffect(() => {
    if (!userId) return;
    startStudying(userId).catch(console.error);
    return () => {
      if (!hasStoppedRef.current) stopStudying(userId).catch(console.error);
    };
  }, [userId]);

  useEffect(() => {
    const handleUnload = () => {
      stopStudying(userId).catch(console.error);
      if (setId) {
        const seconds = Math.floor((Date.now() - sessionStartRef.current) / 1000);
        addSetStudyTime(setId, seconds).catch(console.error);
      }
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [userId, setId]);

  useEffect(() => {
    if (!cards || cards.length === 0) return;
    const shuffled = [...cards].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, numQuestions);
    const questionSet = selected.map((card) => {
      if (card.type === 'FILL_BLANK') {
        return { type: 'FITB', prompt: card.textWithBlanks, correctAnswers: card.correctAnswers };
      } else {
        const incorrectChoices = cards
            .filter((c) => c.id !== card.id && c.type !== 'FILL_BLANK')
            .sort(() => 0.5 - Math.random())
            .slice(0, 3);
        const correctAnswer = promptType === 'term' ? card.definition : card.term;
        return {
          type: 'MCQ',
          prompt: promptType === 'term' ? card.term : card.definition,
          correctAnswer,
          choices: [correctAnswer, ...incorrectChoices.map(c => promptType === 'term' ? c.definition : c.term)].sort(() => 0.5 - Math.random()),
        };
      }
    });
    setQuestions(questionSet);
  }, [cards, promptType, numQuestions]);

  if (questions.length === 0) return <div style={{ textAlign: 'center', marginTop: '50px' }}><button onClick={() => navigate('/')}>Return Home</button></div>;

  const currentQ = questions[currentIndex];

  const isSubmitDisabled = currentQ.type === 'MCQ'
      ? !selectedAnswer
      : currentQ.correctAnswers.some((_, idx) => !userInputs[idx] || userInputs[idx].trim() === "");

  const handleSubmit = () => {
    if (currentQ.type === 'MCQ') {
      if (selectedAnswer === currentQ.correctAnswer) setTotalScore(s => s + 1);
      setShowFeedback(true);
    } else {
      const newFuzzyIndices = [];
      currentQ.correctAnswers.forEach((ans, i) => {
        const userInput = userInputs[i]?.trim().toLowerCase() || "";
        const distance = getEditDistance(userInput, ans.toLowerCase());
        if (distance > 0 && distance <= 2 && !dismissedIndices.includes(i)) {
          newFuzzyIndices.push(i);
        }
      });
      if (newFuzzyIndices.length > 0) { setFuzzyIndices(newFuzzyIndices); return; }

      let correctCount = 0;
      currentQ.correctAnswers.forEach((ans, idx) => {
        if (userInputs[idx]?.trim().toLowerCase() === ans.toLowerCase()) correctCount++;
      });
      setTotalScore(s => s + (correctCount / currentQ.correctAnswers.length));
      setShowFeedback(true);
      setFuzzyIndices([]);
      setDismissedIndices([]);
    }
  };

  const resolveFuzzy = (idx, accept) => {
    if (accept) {
      const newInputs = [...userInputs];
      newInputs[idx] = currentQ.correctAnswers[idx];
      setUserInputs(newInputs);
    } else {
      setDismissedIndices(prev => [...prev, idx]);
    }
    setFuzzyIndices(prev => prev.filter(i => i !== idx));
  };

  const handleNext = () => {
    if (currentIndex === questions.length - 1) {
      if (!hasStoppedRef.current) {
        hasStoppedRef.current = true;
        stopStudying(userId).catch(console.error);
        if (setId) {
          const seconds = Math.floor((Date.now() - sessionStartRef.current) / 1000);
          addSetStudyTime(setId, seconds).catch(console.error);
        }
      }
      navigate('/post_test', { state: { correct: totalScore.toFixed(2), total: questions.length } });
    } else {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setUserInputs([]);
      setShowFeedback(false);
      setFuzzyIndices([]);
      setDismissedIndices([]);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '50px auto', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h3>Question {currentIndex + 1} of {questions.length}</h3>
      <div style={{ padding: '30px', border: '1px solid #ccc', borderRadius: '10px', margin: '20px 0', backgroundColor: '#f9f9f9' }}>
        <h2 style={{ lineHeight: '1.6' }}>{currentQ.prompt}</h2>
      </div>

      {currentQ.type === 'MCQ' ? (
        <div style={{ display: 'grid', gap: '10px' }}>
          {currentQ.choices.map((choice, i) => (
            <button key={i} onClick={() => !showFeedback && setSelectedAnswer(choice)} style={{
              padding: '15px', borderRadius: '8px',
              border: selectedAnswer === choice ? '2px solid #333' : '1px solid #ddd',
              backgroundColor: showFeedback
                  ? (choice === currentQ.correctAnswer ? '#d4edda' : (choice === selectedAnswer ? '#f8d7da' : '#fff'))
                  : (selectedAnswer === choice ? '#eee' : '#fff'),
              cursor: showFeedback ? 'default' : 'pointer'
            }}>{choice}</button>
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', alignItems: 'center' }}>
          {currentQ.correctAnswers.map((ans, idx) => {
            const isCorrect = userInputs[idx]?.trim().toLowerCase() === ans.toLowerCase();
            const hasFuzzyWarning = fuzzyIndices.includes(idx);
            return (
              <div key={idx} style={{ width: '100%', position: 'relative' }}>
                <input
                  type="text"
                  placeholder={`Blank ${idx + 1}...`}
                  value={userInputs[idx] || ''}
                  disabled={showFeedback}
                  onChange={(e) => {
                    const newInputs = [...userInputs];
                    newInputs[idx] = e.target.value;
                    setUserInputs(newInputs);
                    if (dismissedIndices.includes(idx)) setDismissedIndices(prev => prev.filter(i => i !== idx));
                  }}
                  style={{
                    padding: '12px', width: '80%', borderRadius: '5px',
                    border: showFeedback ? (isCorrect ? '2px solid green' : '2px solid red') : (hasFuzzyWarning ? '2px solid #ffa500' : '1px solid #ccc'),
                    outline: 'none'
                  }}
                />
                {hasFuzzyWarning && (
                  <div style={{ position: 'absolute', top: '55px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#fff', border: '2px solid #ffa500', padding: '12px', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', zIndex: 10, width: '220px' }}>
                    <p style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Did you mean <strong>{ans}</strong>?</p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                      <button onClick={() => resolveFuzzy(idx, true)} style={{ padding: '4px 12px', cursor: 'pointer', backgroundColor: '#e3f2fd', border: '1px solid #2196f3', borderRadius: '4px' }}>Yes</button>
                      <button onClick={() => resolveFuzzy(idx, false)} style={{ padding: '4px 12px', cursor: 'pointer', backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px' }}>No</button>
                    </div>
                  </div>
                )}
                {showFeedback && (
                  <p style={{ color: isCorrect ? 'green' : 'red', fontSize: '14px', margin: '5px 0', fontWeight: 'bold' }}>
                    {isCorrect ? '✓ Correct!' : `✗ Incorrect! Answer: ${ans}`}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div style={{ marginTop: '40px' }}>
        {!showFeedback ? (
          <button onClick={handleSubmit} disabled={isSubmitDisabled} style={{
            padding: '12px 40px', fontSize: '18px',
            cursor: isSubmitDisabled ? 'not-allowed' : 'pointer',
            borderRadius: '8px', border: 'none',
            backgroundColor: isSubmitDisabled ? '#ccc' : '#333', color: '#fff'
          }}>Check Answer</button>
        ) : (
          <button onClick={handleNext} style={{ padding: '12px 40px', fontSize: '18px', cursor: 'pointer', borderRadius: '8px', border: 'none', backgroundColor: '#007bff', color: '#fff' }}>
            {currentIndex === questions.length - 1 ? 'Finish Test' : 'Next Question'}
          </button>
        )}
      </div>
    </div>
  );
};

export default PracticeTestPage;