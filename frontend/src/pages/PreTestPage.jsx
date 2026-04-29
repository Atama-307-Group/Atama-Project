import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { generatePracticeTest, getFlashcardSetById } from '../api.js';
import BackButton from '../components/BackButton.jsx';

const PreTestPage = () => {
    const { state } = useLocation();
    const navigate = useNavigate();

    // From PickSetPage we have selectedItems (array of LibraryItem objects)
    const selectedItems = state?.selectedItems || [];
    const forceManual = state?.forceManual || false;

    const hasStudyMaterial = selectedItems.some(i => {
        const t = i.itemType || i.item_type;
        return t !== 'FLASHCARD_SET' && t !== 'flashcard_set';
    });

    const [types, setTypes] = useState(['MCQ']);
    const [numQuestions, setNumQuestions] = useState(10);
    const [maxCards, setMaxCards] = useState(0);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState('');

    const [aiDisabled, setAiDisabled] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('currentUser');
        if (saved) {
            const user = JSON.parse(saved);
            setAiDisabled(user.aiDisabled === true);
        }

        const fetchCards = async () => {
            const flashcardSetIds = selectedItems
                .filter(i => { const t = i.itemType || i.item_type; return t === 'FLASHCARD_SET' || t === 'flashcard_set'; })
                .map(i => i.id);

            if (flashcardSetIds.length > 0) {
                try {
                    const promises = flashcardSetIds.map(id => getFlashcardSetById(id));
                    const sets = await Promise.all(promises);
                    const totalCardCount = sets.reduce((sum, s) => sum + (s.flashcards?.length || 0), 0);
                    setMaxCards(totalCardCount);
                    if (totalCardCount < numQuestions && totalCardCount > 0) {
                        setNumQuestions(totalCardCount);
                    }
                } catch (e) {
                    console.error("Failed to load flashcard sets", e);
                }
            } else {
                setMaxCards(50); // Fallback for pure PDF configurations
            }
        };
        fetchCards();
    }, [selectedItems]);

    const toggleType = (type) => {
        setTypes(prev => {
            if (prev.includes(type)) {
                if (prev.length === 1) return prev; // keep at least 1
                return prev.filter(t => t !== type);
            }
            return [...prev, type];
        });
    };

    useEffect(() => {
        let interval;
        if (loading) {
            setProgress(0);
            // We'll show an initial message about gathering/uploading files to AI
            setLoadingMessage('Uploading materials to AI...');
            interval = setInterval(() => {
                setProgress(prev => {
                    const next = prev + (Math.random() * 8);
                    if (next > 30 && prev <= 30) setLoadingMessage('Analyzing concepts and definitions...');
                    if (next > 65 && prev <= 65) setLoadingMessage('Generating comprehensive questions...');
                    if (next > 90) return 92; // cap it gracefully until backend actually finishes
                    return next;
                });
            }, 600);
        }
        return () => clearInterval(interval);
    }, [loading]);

    const handleStart = async () => {
        try {
            setLoading(true);
            setError('');
            
            const flashcardSetIds = selectedItems
                .filter(i => { const t = i.itemType || i.item_type; return t === 'FLASHCARD_SET' || t === 'flashcard_set'; })
                .map(i => i.id);
            const documentIds = selectedItems
                .filter(i => { const t = i.itemType || i.item_type; return t !== 'FLASHCARD_SET' && t !== 'flashcard_set'; })
                .map(i => i.id);

            const useAi = !forceManual && !aiDisabled;

            const payload = {
                flashcardSetIds,
                documentIds,
                formattedText: '',
                useAi,
                questionTypes: types,
                numQuestions
            };

            const questions = await generatePracticeTest(payload);
            if (!questions || questions.length === 0) {
                setError('No questions could be generated. Please provide valid text or flashcards.');
                return;
            }

            navigate('/practice_test', {
                state: { questions, setId: flashcardSetIds.length > 0 ? flashcardSetIds[0] : null }
            });
        } catch (err) {
            setError(err.message || 'Error generating test');
        } finally {
            setLoading(false);
        }
    };

    const showTextarea = (aiDisabled && hasStudyMaterial) || selectedItems.length === 0;

    return (
        <div style={{ maxWidth: '600px', margin: '50px auto', fontFamily: 'sans-serif', padding: '20px' }}>
            <BackButton />
            <h2 style={{ textAlign: 'center' }}>Practice Test Settings</h2>
            
            {aiDisabled && (
                <div style={{ backgroundColor: '#fff3cd', color: '#856404', padding: '12px', borderRadius: '4px', marginBottom: '20px' }}>
                    <strong>Warning: AI Study is disabled.</strong> Tests will be generated manually using flashcards or your formatted text.
                </div>
            )}

            <div style={{ marginBottom: '20px' }}>
                <p style={{ fontWeight: 'bold' }}>Question Types:</p>
                <label style={{ marginRight: '15px' }}>
                    <input type="checkbox" checked={types.includes('MCQ')} onChange={() => toggleType('MCQ')} /> Multiple Choice
                </label>
                <label style={{ marginRight: '15px' }}>
                    <input type="checkbox" checked={types.includes('TRUE_FALSE')} onChange={() => toggleType('TRUE_FALSE')} /> True/False
                </label>
                <label>
                    <input type="checkbox" checked={types.includes('SHORT_ANSWER')} onChange={() => toggleType('SHORT_ANSWER')} /> Short Answer
                </label>
            </div>

            <div style={{ marginBottom: '20px' }}>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Number of questions:</label>
                <input 
                    type="number"
                    list="questions-options"
                    value={numQuestions} 
                    onChange={(e) => setNumQuestions(Number(e.target.value))} 
                    min="1"
                    max={maxCards > 0 ? maxCards : 50}
                    style={{ padding: '8px', width: '150px' }}
                />
                <datalist id="questions-options">
                    {Array.from({ length: maxCards > 0 ? maxCards : 50 }, (_, i) => i + 1).map(n => (
                        <option key={n} value={n} />
                    ))}
                </datalist>
            </div>



            {error && <p style={{ color: 'red' }}>{error}</p>}

            <div style={{ textAlign: 'center', marginTop: '30px' }}>
                <button 
                    onClick={handleStart} 
                    disabled={loading}
                    style={{ 
                        borderRadius: '5px', 
                        padding: '12px 24px', 
                        fontSize: '18px', 
                        backgroundColor: loading ? '#ccc' : '#335145', 
                        color: '#fff', 
                        border: 'none', 
                        cursor: loading ? 'not-allowed' : 'pointer' 
                    }}
                >
                    {loading ? 'Generating...' : 'Start Test'}
                </button>
            </div>

            {loading && (
                <div style={{ marginTop: '25px', textAlign: 'center', transition: 'all 0.3s ease' }}>
                    <p style={{ marginBottom: '10px', color: '#55916f', fontWeight: 'bold' }}>{loadingMessage}</p>
                    <div style={{ width: '100%', backgroundColor: '#eee', borderRadius: '10px', height: '14px', overflow: 'hidden', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)' }}>
                        <div style={{ 
                            width: `${progress}%`, 
                            backgroundColor: '#335145', 
                            height: '100%', 
                            transition: 'width 0.4s ease-out' 
                        }} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default PreTestPage;