import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AiDisabledModal from '../components/AiDisabledModal.jsx';
import BackButton from '../components/BackButton.jsx';

const PracticeTestOptionsPage = () => {
    const navigate = useNavigate();
    const [aiDisabled, setAiDisabled] = useState(false);
    const [selectedOption, setSelectedOption] = useState(null);
    const [formattedText, setFormattedText] = useState('');
    const [error, setError] = useState('');
    const [showAiModal, setShowAiModal] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('currentUser');
        if (saved) {
            const user = JSON.parse(saved);
            setAiDisabled(user.aiDisabled === true);
        }
    }, []);

    const extract = (line, startKey, endKeys) => {
        let idx = line.toLowerCase().indexOf(startKey.toLowerCase());
        if (idx === -1) return '';
        idx += startKey.length;
        
        let minEnd = line.length;
        for (let ek of endKeys) {
            let endIdx = line.toLowerCase().indexOf(ek.toLowerCase(), idx);
            if (endIdx !== -1 && endIdx < minEnd) {
                minEnd = endIdx;
            }
        }
        
        return line.substring(idx, minEnd).replace(/^[;, ]+/, '').replace(/[;, ]+$/, '').trim();
    };

    const handleStartManual = () => {
        setError('');
        const lines = formattedText.split('\n').filter(l => l.trim() !== '');
        if (lines.length === 0) {
            setError('Please enter at least one question.');
            return;
        }

        try {
            const questions = lines.map((line, index) => {
                const q = extract(line, 'Q:', ['Type:']);
                const typeRaw = extract(line, 'Type:', ['A1:', 'Correct:']);
                const a1 = extract(line, 'A1:', ['A2:', 'A3:', 'A4:', 'Correct:']);
                const a2 = extract(line, 'A2:', ['A3:', 'A4:', 'Correct:']);
                const a3 = extract(line, 'A3:', ['A4:', 'Correct:']);
                const a4 = extract(line, 'A4:', ['Correct:']);
                const correct = extract(line, 'Correct:', []);

                if (!q) throw new Error(`Question ${index + 1} is missing a 'Q:' field.`);
                if (!typeRaw) throw new Error(`Question ${index + 1} is missing a 'Type:' field.`);
                if (!correct) throw new Error(`Question ${index + 1} is missing a 'Correct:' field.`);

                let type = 'SHORT_ANSWER';
                let t = typeRaw.replace(/\s+/g, '').toLowerCase();
                if (t.includes('mc')) type = 'MCQ';
                if (t.includes('t/f') || t.includes('true/false')) type = 'TRUE_FALSE';

                let choices = [];
                if (type === 'MCQ') {
                    if (a1) choices.push(a1);
                    if (a2) choices.push(a2);
                    if (a3) choices.push(a3);
                    if (a4) choices.push(a4);
                    if (choices.length === 0) {
                        choices = [correct]; // Fallback
                    }
                } else if (type === 'TRUE_FALSE') {
                    choices = ['True', 'False'];
                }

                return {
                    type,
                    prompt: q,
                    correctAnswer: correct,
                    correctAnswers: [correct],
                    choices
                };
            });

            navigate('/practice_test', { state: { questions, setId: null } });
        } catch (e) {
            setError('Formatting error: ' + e.message + "\nEnsure you use the format: Q: <>; Type: <>, A1: <>, A2: <>; A3: <>; A4:<>; Correct: <>");
        }
    };

    const handleOptionSelect = (option) => {
        if (option === 3 && aiDisabled) {
            setShowAiModal(true);
            return;
        }
        setError('');
        setSelectedOption(option);
        
        if (option === 2) {
            navigate('/pick-set?mode=test-manual');
        } else if (option === 3) {
            navigate('/pick-set?mode=test-ai');
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '50px auto', fontFamily: 'sans-serif', padding: '20px' }}>
            <div style={{ marginBottom: '1rem' }}>
                <BackButton onClick={() => navigate('/')} />
            </div>
            <h2 style={{ textAlign: 'center', marginBottom: '40px' }}>Practice Test Generation Options</h2>

            {error && (
                <div style={{ backgroundColor: '#fff3cd', color: '#856404', padding: '15px', borderRadius: '5px', marginBottom: '20px', whiteSpace: 'pre-wrap' }}>
                    {error}
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Option 1 */}
                <div 
                    onClick={() => handleOptionSelect(1)}
                    style={{ 
                        border: selectedOption === 1 ? '2px solid #335145' : '1px solid #ddd', 
                        borderRadius: '8px', padding: '20px', cursor: 'pointer',
                        backgroundColor: selectedOption === 1 ? '#eefbf3' : '#fff'
                    }}>
                    <h3 style={{ margin: '0 0 10px 0' }}>Paste formatted text manually</h3>
                    <p style={{ margin: '0 0 10px 0', color: '#555' }}>
                        Provide exactly the questions, types, options, and correct answers you want.
                    </p>
                    {selectedOption === 1 && (
                        <div style={{ marginTop: '15px' }} onClick={e => e.stopPropagation()}>
                            <label style={{ fontSize: '14px', fontWeight: 'bold' }}>Format: Q: &lt;&gt;; Type: &lt;&gt;, A1: &lt;&gt;, A2: &lt;&gt;; A3: &lt;&gt;; A4:&lt;&gt;; Correct: &lt;&gt;</label>
                            <textarea 
                                rows={8}
                                value={formattedText}
                                onChange={e => setFormattedText(e.target.value)}
                                style={{ width: '100%', padding: '10px', marginTop: '10px', marginBottom: '10px' }}
                                placeholder="Q: What color is the sky?; Type: MC, A1: Blue, A2: Green; A3: Red; A4: Yellow; Correct: Blue&#10;Q: Water boils at 100C; Type: T/F, Correct: True&#10;Q: Capital of France; Type: ShortAnswer, Correct: Paris"
                            />
                            <button onClick={handleStartManual} style={{ padding: '10px 20px', backgroundColor: '#335145', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                                Start Practice Test
                            </button>
                        </div>
                    )}
                </div>

                {/* Option 2 */}
                <div 
                    onClick={() => handleOptionSelect(2)}
                    style={{ 
                        border: '1px solid #ddd', 
                        borderRadius: '8px', padding: '20px', cursor: 'pointer',
                        backgroundColor: '#fff'
                    }}>
                    <h3 style={{ margin: '0 0 10px 0' }}>Use flashcard sets:</h3>
                    <p style={{ margin: '0 0 10px 0', color: '#555' }}>
                        Select your flashcard sets and generate a test
                    </p>
                </div>

                {/* Option 3 */}
                <div 
                    onClick={() => handleOptionSelect(3)}
                    style={{ 
                        border: '1px solid #ddd', 
                        borderRadius: '8px', padding: '20px', 
                        cursor: aiDisabled ? 'not-allowed' : 'pointer',
                        backgroundColor: aiDisabled ? '#f5f5f5' : '#fff',
                        opacity: aiDisabled ? 0.6 : 1
                    }}>
                    <h3 style={{ margin: '0 0 10px 0' }}>
                        Generate a test using AI ✨
                    </h3>
                    <p style={{ margin: '0 0 10px 0', color: '#555' }}>
                        Select both Flashcard Sets and Documents (PDFs) to automatically generate comprehensive practice tests using AI.
                    </p>
                    {aiDisabled && <p style={{ color: '#856404', fontSize: '0.9rem', margin: 0, fontWeight: 'bold' }}>AI Toggle is OFF in Settings.</p>}
                </div>

            </div>
            {showAiModal && <AiDisabledModal onClose={() => setShowAiModal(false)} />}
        </div>
    );
};

export default PracticeTestOptionsPage;
