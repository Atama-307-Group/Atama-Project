import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { startStudying, stopStudying, addSetStudyTime, recordAccess } from "../api.js";

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

  const { promptType, cards, numQuestions, setId } = location.state || {
    promptType: 'term', cards: [], numQuestions: 0, setId: null,
  };

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
    if (currentQ.type === 'MCQ') {
      if (selectedAnswer === currentQ.correctAnswer) setTotalScore(s => s + 1);
      setShowFeedback(true);
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
      setFuzzyIndices([]);
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

  const resolveFuzzy = (idx, accept) => {
    if (accept) {
      const next = [...userInputs];
      next[idx] = currentQ.correctAnswers[idx];
      setUserInputs(next);
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
      setCurrentIndex(i => i + 1);
      setSelectedAnswer(null);
      setUserInputs([]);
      setShowFeedback(false);
      setFuzzyIndices([]);
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
              border: selectedAnswer === choice ? '2px solid #333' : '1px solid #ddd',
              backgroundColor: showFeedback
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
            const hasFuzzyWarning = fuzzyIndices.includes(idx);
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
                  <div style={{
                    position: 'absolute', top: '55px', left: '50%', transform: 'translateX(-50%)',
                    backgroundColor: '#fff', border: '2px solid #ffa500', padding: '12px',
                    borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', zIndex: 10, width: '220px',
                  }}>
                    <p style={{ margin: '0 0 10px', fontSize: '14px' }}>Did you mean <strong>{ans}</strong>?</p>
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