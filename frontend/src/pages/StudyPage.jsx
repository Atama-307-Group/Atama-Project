import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './StudyPage.css';
import { startStudying, stopStudying, updateCardProgress, addSetStudyTime, getSetProgress } from "../api.js";

const KNOWLEDGE_OPTIONS = [
    { value: 'DONT_KNOW',     label: "Don't Know",    color: '#ef4444' },
    { value: 'KNOW_SOMEWHAT', label: 'Know Somewhat',  color: '#f59e0b' },
    { value: 'KNOW_WELL',     label: 'Know Well',      color: '#22c55e' },
];

const StudyPage = ({ onToggleFavorite, userId }) => {
    const location = useLocation();
    const navigate = useNavigate();

    const studyMode = location.state?.frontChoice || 'term';
    const initialFlashcards = location.state?.cards || [];
    const setId = location.state?.setId || null;

    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [flippedCards, setFlippedCards] = useState(new Set());
    const [cards, setCards] = useState(initialFlashcards);
    const [knowledgeMap, setKnowledgeMap] = useState({}); // cardId -> level

    useEffect(() => {
        if (!setId) return;
        getSetProgress(setId)
            .then((progressList) => {
                const map = {};
                (progressList || []).forEach(p => {
                    const cardId = p.flashcard?.id ?? p.flashcardId;
                    if (cardId) map[cardId] = p.knowledgeLevel;
                });
                setKnowledgeMap(map);
            })
            .catch(console.error);
    }, [setId]);

    const sessionStartRef = useRef(Date.now());
    const hasStoppedRef = useRef(false);

    useEffect(() => {
        if (!userId) return;
        startStudying(userId).catch(console.error);
        return () => {
            stopStudying(userId).catch(console.error);
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

    if (!cards || cards.length === 0) {
        return (
            <div style={{ textAlign: 'center', marginTop: '100px' }}>
                <h2>No cards found for this session.</h2>
                <button onClick={() => navigate('/')}>Return Home</button>
            </div>
        );
    }

    const currentCard = cards[currentIndex];
    const isFITB = currentCard.type === 'FILL_BLANK';

    const frontContent = isFITB
        ? currentCard.textWithBlanks
        : (studyMode === 'term' ? currentCard.term : currentCard.definition);

    const backContent = isFITB
        ? currentCard.correctAnswers.join(', ')
        : (studyMode === 'term' ? currentCard.definition : currentCard.term);

    const handleFlip = () => {
        setIsFlipped(!isFlipped);
        if (!isFlipped) {
            const newFlipped = new Set(flippedCards);
            newFlipped.add(currentIndex);
            setFlippedCards(newFlipped);
        }
    };

    const handleNext = () => { setIsFlipped(false); setCurrentIndex((prev) => (prev + 1) % cards.length); };
    const handlePrev = () => { setIsFlipped(false); setCurrentIndex((prev) => (prev === 0 ? cards.length - 1 : prev - 1)); };
    const handleReset = () => { setIsFlipped(false); setCurrentIndex(0); };

    const handleKnowledgeChange = async (level) => {
        const cardId = currentCard.id;
        setKnowledgeMap(prev => ({ ...prev, [cardId]: level }));
        if (setId && cardId) {
            try {
                await updateCardProgress(setId, cardId, level);
            } catch (e) {
                console.error("Failed to update card progress:", e);
            }
        }
    };

    const handleDone = async () => {
        try {
            await stopStudying(userId);
            if (setId) {
                const seconds = Math.floor((Date.now() - sessionStartRef.current) / 1000);
                await addSetStudyTime(setId, seconds).catch(console.error);
            }
            navigate('/post_learn', {
                state: { studiedCount: flippedCards.size, totalCount: cards.length }
            });
        } catch (err) {
            console.error("Failed to finish session:", err);
            alert("Could not finish session. Please try again.");
        }
    };

    const handleToggleFavorite = (e) => {
        e.stopPropagation();
        if (onToggleFavorite) onToggleFavorite(currentCard.id);
        setCards(prev => prev.map(c => c.id === currentCard.id ? { ...c, favorite: !c.favorite } : c));
    };

    const currentKnowledge = knowledgeMap[currentCard.id] ?? 'DONT_KNOW';
    const currentKnowledgeOption = KNOWLEDGE_OPTIONS.find(o => o.value === currentKnowledge);

    return (
        <div style={{ maxWidth: '500px', margin: '50px auto', textAlign: 'center' }}>
            <h2>Learn</h2>

            <div style={{ position: 'relative', width: '400px', maxWidth: '90%', margin: '0 auto' }}>
                <button
                    onClick={handleToggleFavorite}
                    title="Favorite"
                    style={{
                        position: 'absolute', top: '10px', right: '24px', zIndex: 10,
                        background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer',
                        color: currentCard.favorite ? '#f5c518' : '#ccc', transition: 'color 0.2s',
                    }}
                >
                    {currentCard.favorite ? '★' : '☆'}
                </button>

                <div style={{ perspective: '1000px', width: '100%', marginBottom: '12px' }}>
                    <div
                        onClick={handleFlip}
                        style={{
                            width: '100%', height: '200px', position: 'relative',
                            transformStyle: 'preserve-3d', WebkitTransformStyle: 'preserve-3d',
                            transition: 'transform 0.6s',
                            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                            cursor: 'pointer',
                        }}
                    >
                        <div style={{
                            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                            backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            padding: '20px', boxSizing: 'border-box',
                            border: '2px solid #333', borderRadius: '10px', backgroundColor: 'white',
                        }}>
                            {frontContent}
                        </div>
                        <div style={{
                            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                            backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
                            transform: 'rotateY(180deg)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            padding: '20px', boxSizing: 'border-box',
                            border: '2px solid #333', borderRadius: '10px', backgroundColor: 'white',
                        }}>
                            {backContent}
                        </div>
                    </div>
                </div>

                {/* Knowledge level dropdown */}
                <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', color: '#666' }}>I</span>
                    <select
                        value={currentKnowledge}
                        onChange={(e) => handleKnowledgeChange(e.target.value)}
                        style={{
                            padding: '6px 10px',
                            borderRadius: '8px',
                            border: `2px solid ${currentKnowledgeOption.color}`,
                            color: currentKnowledgeOption.color,
                            fontWeight: '600',
                            fontSize: '13px',
                            background: 'white',
                            cursor: 'pointer',
                        }}
                    >
                        {KNOWLEDGE_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                    <span style={{ fontSize: '13px', color: '#666' }}>this card</span>
                </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
                <button onClick={handlePrev} style={{ marginRight: '10px' }}>Previous</button>
                <button onClick={handleNext}>Next</button>
                <button onClick={handleReset} style={{ marginLeft: '10px' }} disabled={currentIndex === 0}>Return To Beginning</button>
            </div>

            <p>Card {currentIndex + 1} of {cards.length}</p>

            <button onClick={handleDone} style={{ padding: '10px 20px', cursor: 'pointer', borderRadius: '5px' }}>
                Finish Session
            </button>
        </div>
    );
};

export default StudyPage;