import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { startStudying, stopStudying, addSetStudyTime, recordAccess } from "../api.js";

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

/* ── Question builders per card type ─────────────────────────────── */

function buildQuestion(card, promptType, allCards) {
  switch (card.type) {

    case 'FILL_BLANK':
      return {
        type: 'FITB',
        cardType: 'FILL_BLANK',
        prompt: card.textWithBlanks,
        correctAnswers: card.correctAnswers,
      };

    case 'STEPS':
      // Show the title, user must type each step in order
      return {
        type: 'STEPS',
        cardType: 'STEPS',
        prompt: card.title,
        steps: card.steps || [],
        imageUrl: null,
      };

    case 'DRAG_DROP':
      return {
        type: 'ZONES',
        cardType: 'DRAG_DROP',
        prompt: card.prompt,
        imageUrl: card.imageUrl || null,
        zones: (card.dropZones || []).map(z => ({
          label: z.label,
          correctAnswer: z.correctAnswer ?? z.correct_answer ?? '', // handle both casings
        })),
      };

    default: {
      // Regular card — MCQ
      const incorrectChoices = allCards
        .filter(c => c.id !== card.id && c.type !== 'FILL_BLANK' && c.type !== 'STEPS' && c.type !== 'DRAG_DROP')
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);
      const correctAnswer = promptType === 'term' ? card.definition : card.term;
      return {
        type: 'MCQ',
        cardType: 'DEFAULT',
        prompt: promptType === 'term' ? card.term : card.definition,
        correctAnswer,
        choices: [
          correctAnswer,
          ...incorrectChoices.map(c => promptType === 'term' ? c.definition : c.term),
        ].sort(() => 0.5 - Math.random()),
      };
    }
  }
}

/* ── Steps question renderer ─────────────────────────────────────── */

function StepsQuestion({ question, userInputs, setUserInputs, showFeedback }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
      <p style={{ color: '#666', fontSize: '13px', margin: '0 0 4px' }}>
        Type each step in order:
      </p>
      {question.steps.map((step, idx) => {
        const userVal = userInputs[idx] || '';
        const isCorrect = showFeedback && userVal.trim().toLowerCase() === step.trim().toLowerCase();
        const isWrong = showFeedback && !isCorrect;
        return (
          <div key={idx} style={{ width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                minWidth: '24px', height: '24px', borderRadius: '50%',
                background: showFeedback ? (isCorrect ? '#22c55e' : '#ef4444') : '#333',
                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '12px', fontWeight: '700', flexShrink: 0,
              }}>
                {idx + 1}
              </span>
              <input
                type="text"
                placeholder={`Step ${idx + 1}…`}
                value={userVal}
                disabled={showFeedback}
                onChange={e => {
                  const next = [...userInputs];
                  next[idx] = e.target.value;
                  setUserInputs(next);
                }}
                style={{
                  flex: 1, padding: '10px 12px', borderRadius: '6px',
                  border: showFeedback
                    ? (isCorrect ? '2px solid #22c55e' : '2px solid #ef4444')
                    : '1px solid #ccc',
                  outline: 'none', fontSize: '14px',
                }}
              />
            </div>
            {isWrong && (
              <p style={{ color: '#ef4444', fontSize: '13px', margin: '4px 0 0 32px', textAlign: 'left' }}>
                ✗ Expected: <strong>{step}</strong>
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Zones (DragDrop) question renderer ─────────────────────────── */

function ZonesQuestion({ question, userInputs, setUserInputs, showFeedback }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
      {question.imageUrl && (
        <img
          src={question.imageUrl}
          alt="diagram"
          style={{ maxWidth: '100%', maxHeight: '160px', objectFit: 'contain', borderRadius: '8px', marginBottom: '8px' }}
        />
      )}
      <p style={{ color: '#666', fontSize: '13px', margin: '0 0 4px' }}>
        Fill in each zone's correct answer:
      </p>
      {question.zones.map((zone, idx) => {
        const userVal = userInputs[idx] || '';
        const isCorrect = showFeedback && userVal.trim().toLowerCase() === zone.correctAnswer.trim().toLowerCase();
        const isWrong = showFeedback && !isCorrect;
        return (
          <div key={idx} style={{ width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                fontSize: '12px', fontWeight: '600', color: '#555',
                minWidth: '80px', textAlign: 'right', flexShrink: 0,
              }}>
                {zone.label}:
              </span>
              <input
                type="text"
                placeholder={`Answer for "${zone.label}"…`}
                value={userVal}
                disabled={showFeedback}
                onChange={e => {
                  const next = [...userInputs];
                  next[idx] = e.target.value;
                  setUserInputs(next);
                }}
                style={{
                  flex: 1, padding: '10px 12px', borderRadius: '6px',
                  border: showFeedback
                    ? (isCorrect ? '2px solid #22c55e' : '2px solid #ef4444')
                    : '1px solid #ccc',
                  outline: 'none', fontSize: '14px',
                }}
              />
            </div>
            {isWrong && (
              <p style={{ color: '#ef4444', fontSize: '13px', margin: '4px 0 0 96px', textAlign: 'left' }}>
                ✗ Expected: <strong>{zone.correctAnswer}</strong>
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Main Component ──────────────────────────────────────────────── */

const PracticeTestPage = ({ userId }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const hasStoppedRef = useRef(false);
  const sessionStartRef = useRef(Date.now());

  const { questions: initialQuestions, setId } = location.state || { questions: [], setId: null };
  const { promptType, cards, numQuestions, setId } = location.state || {
    promptType: 'term', cards: [], numQuestions: 0, setId: null,
  };

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

  useEffect(() => {
        if (!setId) return;
        recordAccess(setId).catch(console.error);
  }, [setId]);

  if (!questions || questions.length === 0) return <div style={{ textAlign: 'center', marginTop: '50px' }}><button onClick={() => navigate('/')}>Return Home</button></div>;

  const currentQ = questions[currentIndex];

  const isSubmitDisabled = (currentQ.type === 'MCQ' || currentQ.type === 'TRUE_FALSE')
      ? !selectedAnswer
      : currentQ.type === 'SHORT_ANSWER' 
        ? !userInputs[0] || userInputs[0].trim() === ""
        : currentQ.correctAnswers.some((_, idx) => !userInputs[idx] || userInputs[idx].trim() === "");
    if (!setId) return;
    recordAccess(setId).catch(console.error);
  }, [setId]);

  useEffect(() => {
    if (!cards || cards.length === 0) return;
    const shuffled = [...cards].filter(card => card.type !== 'DRAG_DROP').sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, numQuestions);
    setQuestions(selected.map(card => buildQuestion(card, promptType, cards)));
  }, [cards, promptType, numQuestions]);

  if (questions.length === 0) {
    return (
      <div style={{ textAlign: 'center', marginTop: '50px' }}>
        <button onClick={() => navigate('/')}>Return Home</button>
      </div>
    );
  }

  const currentQ = questions[currentIndex];

  /* ── Submit disabled logic ── */
  const isSubmitDisabled = (() => {
    if (currentQ.type === 'MCQ') return !selectedAnswer;
    if (currentQ.type === 'FITB') return currentQ.correctAnswers.some((_, i) => !userInputs[i]?.trim());
    if (currentQ.type === 'STEPS') return currentQ.steps.some((_, i) => !userInputs[i]?.trim());
    if (currentQ.type === 'ZONES') return currentQ.zones.some((_, i) => !userInputs[i]?.trim());    return false;
  })();

  /* ── Submit handler ── */
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
      return;
    }

    if (currentQ.type === 'FITB') {
      // Fuzzy matching for FITB
      const newFuzzy = [];
      currentQ.correctAnswers.forEach((ans, i) => {
        const input = userInputs[i]?.trim().toLowerCase() || '';
        const dist = getEditDistance(input, ans.toLowerCase());
        if (dist > 0 && dist <= 2 && !dismissedIndices.includes(i)) newFuzzy.push(i);
      });
      if (newFuzzy.length > 0) { setFuzzyIndices(newFuzzy); return; }

      let correct = 0;
      currentQ.correctAnswers.forEach((ans, i) => {
        if (userInputs[i]?.trim().toLowerCase() === ans.toLowerCase()) correct++;
      });
      setTotalScore(s => s + correct / currentQ.correctAnswers.length);
      setShowFeedback(true);
      setFuzzyMatches([]);
      setDismissedIndices([]);
      return;
    }

    if (currentQ.type === 'STEPS') {
      let correct = 0;
      currentQ.steps.forEach((step, i) => {
        if (userInputs[i]?.trim().toLowerCase() === step.trim().toLowerCase()) correct++;
      });
      setTotalScore(s => s + correct / currentQ.steps.length);
      setShowFeedback(true);
      return;
    }

    if (currentQ.type === 'ZONES') {
      let correct = 0;
      currentQ.zones.forEach((zone, i) => {
        if (userInputs[i]?.trim().toLowerCase() === zone.correctAnswer.trim().toLowerCase()) correct++;
      });
      setTotalScore(s => s + correct / currentQ.zones.length);
      setShowFeedback(true);
      return;
    }
  };

  const resolveFuzzy = (idx, accept, expectedVal) => {
    if (accept) {
      const newInputs = [...userInputs];
      newInputs[idx] = expectedVal;
      setUserInputs(newInputs);
      const next = [...userInputs];
      next[idx] = currentQ.correctAnswers[idx];
      setUserInputs(next);
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
      setCurrentIndex(i => i + 1);
      setSelectedAnswer(null);
      setUserInputs([]);
      setShowFeedback(false);
      setFuzzyMatches([]);
      setDismissedIndices([]);
    }
  };

  /* ── Card type badge ── */
  const typeBadge = {
    FILL_BLANK: { label: 'Fill in the Blank', color: '#6366f1' },
    STEPS:      { label: 'Steps',             color: '#0ea5e9' },
    DRAG_DROP:  { label: 'Diagram',           color: '#f59e0b' },
  }[currentQ.cardType];

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
      <h3>Question {currentIndex + 1} of {questions.length}</h3>

      {/* Prompt card */}
      <div style={{
        padding: '30px', border: '1px solid #ccc', borderRadius: '10px',
        margin: '20px 0', backgroundColor: '#f9f9f9', position: 'relative',
      }}>
        {typeBadge && (
          <span style={{
            position: 'absolute', top: '10px', left: '12px',
            background: typeBadge.color, color: 'white',
            fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '999px',
          }}>
            {typeBadge.label}
          </span>
        )}
        <h2 style={{ lineHeight: '1.6', marginTop: typeBadge ? '16px' : 0 }}>{currentQ.prompt}</h2>
      </div>

      {/* Answer area */}
      {currentQ.type === 'MCQ' && (
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
                ? (choice === currentQ.correctAnswer ? '#d4edda' : (choice === selectedAnswer ? '#f8d7da' : '#fff'))
                : (selectedAnswer === choice ? '#eee' : '#fff'),
              cursor: showFeedback ? 'default' : 'pointer',
            }}>{choice}</button>
          ))}
        </div>
      )}

      {currentQ.type === 'FITB' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', alignItems: 'center' }}>
          {currentQ.correctAnswers.map((ans, idx) => {
            const isCorrect = userInputs[idx]?.trim().toLowerCase() === ans.toLowerCase();
            const fuzzyMatch = fuzzyMatches.find(fm => fm.index === idx);
            const hasFuzzyWarning = !!fuzzyMatch;
            return (
              <div key={idx} style={{ width: '100%', position: 'relative' }}>
                <input
                  type="text"
                  placeholder={`Blank ${idx + 1}…`}
                  value={userInputs[idx] || ''}
                  disabled={showFeedback}
                  onChange={e => {
                    const next = [...userInputs];
                    next[idx] = e.target.value;
                    setUserInputs(next);
                    if (dismissedIndices.includes(idx)) setDismissedIndices(prev => prev.filter(i => i !== idx));
                  }}
                  style={{
                    padding: '12px', width: '80%', borderRadius: '5px',
                    border: showFeedback
                      ? (isCorrect ? '2px solid green' : '2px solid red')
                      : (hasFuzzyWarning ? '2px solid #ffa500' : '1px solid #ccc'),
                    outline: 'none',
                  }}
                />
                {hasFuzzyWarning && (
                  <div style={{ position: 'absolute', top: '55px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#fff', border: '2px solid #ffa500', padding: '12px', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', zIndex: 10, width: '220px' }}>
                    <p style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Did you mean <strong>{fuzzyMatch.expected}</strong>?</p>
                  <div style={{
                    position: 'absolute', top: '55px', left: '50%', transform: 'translateX(-50%)',
                    backgroundColor: '#fff', border: '2px solid #ffa500', padding: '12px',
                    borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', zIndex: 10, width: '220px',
                  }}>
                    <p style={{ margin: '0 0 10px', fontSize: '14px' }}>Did you mean <strong>{ans}</strong>?</p>
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

      {currentQ.type === 'STEPS' && (
        <StepsQuestion
          question={currentQ}
          userInputs={userInputs}
          setUserInputs={setUserInputs}
          showFeedback={showFeedback}
        />
      )}

      {currentQ.type === 'ZONES' && (
        <ZonesQuestion
          question={currentQ}
          userInputs={userInputs}
          setUserInputs={setUserInputs}
          showFeedback={showFeedback}
        />
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
          <button
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
            style={{
              padding: '12px 40px', fontSize: '18px',
              cursor: isSubmitDisabled ? 'not-allowed' : 'pointer',
              borderRadius: '8px', border: 'none',
              backgroundColor: isSubmitDisabled ? '#ccc' : '#333', color: '#fff',
            }}
          >
            Check Answer
          </button>
        ) : (
          <button
            onClick={handleNext}
            style={{
              padding: '12px 40px', fontSize: '18px', cursor: 'pointer',
              borderRadius: '8px', border: 'none', backgroundColor: '#007bff', color: '#fff',
            }}
          >
            {currentIndex === questions.length - 1 ? 'Finish Test' : 'Next Question'}
          </button>
        )}
      </div>
    </div>
  );
};

export default PracticeTestPage;