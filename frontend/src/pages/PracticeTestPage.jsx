import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { startStudying, stopStudying, addSetStudyTime } from "../api.js";

const getEditDistance = (a, b) => {
  if (!a || !b) return (a || b || '').length;
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

  const { questions: initialQuestions, setId } = location.state || { questions: [], setId: null };

  const [questions, setQuestions] = useState(initialQuestions || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInputs, setUserInputs] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [fuzzyMatches, setFuzzyMatches] = useState([]); // Array of { index, expected, userTyped } for blanks
  const [dismissedIndices, setDismissedIndices] = useState([]);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (!userId) return;
    startStudying(userId).catch(console.error);
    
    // Timer
    const timerInterval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => {
      clearInterval(timerInterval);
      if (!hasStoppedRef.current) stopStudying(userId).catch(console.error);
    };
  }, [userId]);

  const formatTime = (seconds) => {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m}:${s.toString().padStart(2, '0')}`;
  };

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

  if (!questions || questions.length === 0) return <div style={{ textAlign: 'center', marginTop: '50px' }}><button onClick={() => navigate('/')}>Return Home</button></div>;

  const currentQ = questions[currentIndex];

  const isSubmitDisabled = (currentQ.type === 'MCQ' || currentQ.type === 'TRUE_FALSE')
      ? !selectedAnswer
      : currentQ.type === 'SHORT_ANSWER' 
        ? !userInputs[0] || userInputs[0].trim() === ""
        : currentQ.correctAnswers.some((_, idx) => !userInputs[idx] || userInputs[idx].trim() === "");

  const handleSubmit = () => {
    if (currentQ.type === 'MCQ' || currentQ.type === 'TRUE_FALSE') {
      if (selectedAnswer === currentQ.correctAnswer) setTotalScore(s => s + 1);
      setShowFeedback(true);
    } else if (currentQ.type === 'SHORT_ANSWER') {
      // One blank, check against ANY correct answer
      const userInput = userInputs[0]?.trim().toLowerCase() || "";
      let isCorrect = false;
      let matchedFuzzy = null;

      for (const ans of currentQ.correctAnswers) {
        if (userInput === ans.toLowerCase()) {
          isCorrect = true;
          break;
        }
      }

      if (!isCorrect) {
        for (const ans of currentQ.correctAnswers) {
          const distance = getEditDistance(userInput, ans.toLowerCase());
          if (distance > 0 && distance <= 2 && !dismissedIndices.includes(0)) {
            matchedFuzzy = ans;
            break;
          }
        }
      }

      if (matchedFuzzy) {
        setFuzzyMatches([{ index: 0, expected: matchedFuzzy, userTyped: userInputs[0] }]);
        return;
      }

      if (isCorrect) setTotalScore(s => s + 1);
      setShowFeedback(true);
      setFuzzyMatches([]);
      setDismissedIndices([]);
    } else {
      // FITB: Multiple blanks
      const newFuzzyMatches = [];
      let allCorrect = true;
      let correctCount = 0;

      currentQ.correctAnswers.forEach((ans, i) => {
        const userInput = userInputs[i]?.trim().toLowerCase() || "";
        const isMatch = userInput === ans.toLowerCase();
        
        if (!isMatch) {
            allCorrect = false;
            const distance = getEditDistance(userInput, ans.toLowerCase());
            if (distance > 0 && distance <= 2 && !dismissedIndices.includes(i)) {
              newFuzzyMatches.push({ index: i, expected: ans, userTyped: userInputs[i] });
            }
        } else {
            correctCount++;
        }
      });
      
      if (newFuzzyMatches.length > 0) { 
          setFuzzyMatches(newFuzzyMatches); 
          return; 
      }

      setTotalScore(s => s + (correctCount / currentQ.correctAnswers.length));
      setShowFeedback(true);
      setFuzzyMatches([]);
      setDismissedIndices([]);
    }
  };

  const resolveFuzzy = (idx, accept, expectedVal) => {
    if (accept) {
      const newInputs = [...userInputs];
      newInputs[idx] = expectedVal;
      setUserInputs(newInputs);
    } else {
      setDismissedIndices(prev => [...prev, idx]);
    }
    setFuzzyMatches(prev => prev.filter(fm => fm.index !== idx));
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
      setFuzzyMatches([]);
      setDismissedIndices([]);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '50px auto', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', alignSelf: 'flex-start' }}>← Back</button>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>⏱ {formatTime(elapsedTime)}</div>
      </div>
      
      <div style={{ margin: '20px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span>Question {currentIndex + 1} of {questions.length}</span>
              <span>Score: {totalScore.toFixed(2)}</span>
          </div>
          <div style={{ width: '100%', height: '10px', backgroundColor: '#e0e0e0', borderRadius: '5px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${((currentIndex) / questions.length) * 100}%`, backgroundColor: '#335145', transition: 'width 0.3s' }}></div>
          </div>
      </div>

      <div style={{ padding: '30px', border: '1px solid #ccc', borderRadius: '10px', margin: '20px 0', backgroundColor: '#f9f9f9', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <h2 style={{ lineHeight: '1.6' }}>{currentQ.prompt}</h2>
      </div>

      {currentQ.type === 'MCQ' || currentQ.type === 'TRUE_FALSE' ? (
        <div style={{ display: 'grid', gap: '10px' }}>
          {currentQ.choices.map((choice, i) => (
            <button key={i} onClick={() => !showFeedback && setSelectedAnswer(choice)} style={{
              padding: '15px', borderRadius: '8px',
              border: selectedAnswer === choice ? '2px solid #335145' : '1px solid #ddd',
              backgroundColor: showFeedback
                  ? (choice === currentQ.correctAnswer ? '#d4edda' : (choice === selectedAnswer ? '#f8d7da' : '#fff'))
                  : (selectedAnswer === choice ? '#eefbf3' : '#fff'),
              cursor: showFeedback ? 'default' : 'pointer',
              color: showFeedback && choice === currentQ.correctAnswer ? '#155724' : '#000',
              fontWeight: showFeedback && choice === currentQ.correctAnswer ? 'bold' : 'normal'
            }}>{choice}</button>
          ))}
        </div>
      ) : currentQ.type === 'SHORT_ANSWER' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', alignItems: 'center' }}>
            <div style={{ width: '100%', position: 'relative' }}>
              <input
                type="text"
                placeholder="Type your answer here..."
                value={userInputs[0] || ''}
                disabled={showFeedback}
                onChange={(e) => {
                  setUserInputs([e.target.value]);
                  if (dismissedIndices.includes(0)) setDismissedIndices([]);
                }}
                style={{
                  padding: '12px', width: '80%', borderRadius: '5px',
                  border: showFeedback 
                    ? (currentQ.correctAnswers.some(ans => ans.toLowerCase() === (userInputs[0]||'').trim().toLowerCase()) ? '2px solid green' : '2px solid red') 
                    : (fuzzyMatches.length > 0 ? '2px solid #ffa500' : '1px solid #ccc'),
                  outline: 'none',
                  fontSize: '16px'
                }}
              />
              {fuzzyMatches.length > 0 && fuzzyMatches[0].index === 0 && (
                <div style={{ position: 'absolute', top: '55px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#fff', border: '2px solid #ffa500', padding: '12px', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', zIndex: 10, width: '220px' }}>
                  <p style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Did you mean <strong>{fuzzyMatches[0].expected}</strong>?</p>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                    <button onClick={() => resolveFuzzy(0, true, fuzzyMatches[0].expected)} style={{ padding: '4px 12px', cursor: 'pointer', backgroundColor: '#eefbf3', border: '1px solid #335145', borderRadius: '4px' }}>Yes</button>
                    <button onClick={() => resolveFuzzy(0, false, fuzzyMatches[0].expected)} style={{ padding: '4px 12px', cursor: 'pointer', backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px' }}>No</button>
                  </div>
                </div>
              )}
              {showFeedback && (
                <div style={{marginTop: '10px'}}>
                  {currentQ.correctAnswers.some(ans => ans.toLowerCase() === (userInputs[0]||'').trim().toLowerCase()) ? (
                     <p style={{ color: 'green', fontWeight: 'bold' }}>✓ Correct!</p>
                  ) : (
                     <p style={{ color: 'red', fontWeight: 'bold' }}>✗ Incorrect! Acceptable answers: {currentQ.correctAnswers.join(' OR ')}</p>
                  )}
                </div>
              )}
            </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', alignItems: 'center' }}>
          {currentQ.correctAnswers.map((ans, idx) => {
            const isCorrect = userInputs[idx]?.trim().toLowerCase() === ans.toLowerCase();
            const fuzzyMatch = fuzzyMatches.find(fm => fm.index === idx);
            const hasFuzzyWarning = !!fuzzyMatch;
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
                    <p style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Did you mean <strong>{fuzzyMatch.expected}</strong>?</p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                      <button onClick={() => resolveFuzzy(idx, true, fuzzyMatch.expected)} style={{ padding: '4px 12px', cursor: 'pointer', backgroundColor: '#e3f2fd', border: '1px solid #2196f3', borderRadius: '4px' }}>Yes</button>
                      <button onClick={() => resolveFuzzy(idx, false, fuzzyMatch.expected)} style={{ padding: '4px 12px', cursor: 'pointer', backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px' }}>No</button>
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
            backgroundColor: isSubmitDisabled ? '#ccc' : '#335145', color: '#fff'
          }}>Check Answer</button>
        ) : (
          <button onClick={handleNext} style={{ padding: '12px 40px', fontSize: '18px', cursor: 'pointer', borderRadius: '8px', border: 'none', backgroundColor: '#55916f', color: '#fff' }}>
            {currentIndex === questions.length - 1 ? 'Finish Test' : 'Next Question'}
          </button>
        )}
      </div>
    </div>
  );
};

export default PracticeTestPage;