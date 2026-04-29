import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './StudyPage.css';
import { startStudying, stopStudying, updateCardProgress, addSetStudyTime, getSetProgress, recordAccess } from "../api.js";
import BackButton from '../components/BackButton.jsx';

const KNOWLEDGE_OPTIONS = [
    { value: 'DONT_KNOW',     label: "Don't Know",    color: '#ef4444' },
    { value: 'KNOW_SOMEWHAT', label: 'Know Somewhat',  color: '#f59e0b' },
    { value: 'KNOW_WELL',     label: 'Know Well',      color: '#22c55e' },
];

/* ── Card content helpers ────────────────────────────────────────── */

function getCardFront(card, studyMode) {
    switch (card.type) {
        case 'FILL_BLANK':
            return { text: card.textWithBlanks, isRich: false };
        case 'STEPS':
            return { text: card.title, isRich: false };
        case 'DRAG_DROP':
            return { text: card.prompt, imageUrl: card.imageUrl, isRich: false };
        default:
            return { text: studyMode === 'term' ? card.term : card.definition, isRich: false };
    }
}

function getCardBack(card, studyMode) {
    switch (card.type) {
        case 'FILL_BLANK':
            return { text: card.correctAnswers?.join(', '), isRich: false };
        case 'STEPS':
            return { steps: card.steps, isRich: true };
        case 'DRAG_DROP':
            return { draggableLabels: card.draggableLabels, isRich: true };
        default:
            return { text: studyMode === 'term' ? card.definition : card.term, isRich: false };
    }
}

function CardFrontContent({ front }) {
    return (
        <div style={{ textAlign: 'center' }}>
            {front.imageUrl && (
                <img
                    src={front.imageUrl}
                    alt="card"
                    style={{ maxWidth: '100%', maxHeight: '100px', objectFit: 'contain', marginBottom: '8px', borderRadius: '6px' }}
                />
            )}
            <div>{front.text}</div>
        </div>
    );
}

function CardBackContent({ back }) {
    if (back.steps) {
        return (
            <ol style={{ textAlign: 'left', paddingLeft: '20px', margin: 0, fontSize: '13px' }}>
                {back.steps.map((step, i) => (
                    <li key={i} style={{ marginBottom: '4px' }}>{step}</li>
                ))}
            </ol>
        );
    }
    if (back.draggableLabels) {
        return (
            <div style={{ textAlign: 'left', fontSize: '13px' }}>
                <p style={{ margin: '0 0 6px', fontWeight: '600', color: '#666' }}>Labels in this diagram:</p>
                {back.draggableLabels.map((label, i) => (
                    <div key={i} style={{ marginBottom: '4px' }}>• {label}</div>
                ))}
            </div>
        );
    }
    return <div>{back.text}</div>;
}

function getCardTypeBadge(type) {
    switch (type) {
        case 'FILL_BLANK': return { label: 'Fill in the Blank', color: '#6366f1' };
        case 'STEPS':      return { label: 'Steps',             color: '#0ea5e9' };
        case 'DRAG_DROP':  return { label: 'Diagram',           color: '#f59e0b' };
        default:           return null;
    }
}

/* ── Main Component ──────────────────────────────────────────────── */

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
    const [knowledgeMap, setKnowledgeMap] = useState({});

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

    useEffect(() => {
        if (!setId) return;
        recordAccess(setId).catch(console.error);
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
    const front = getCardFront(currentCard, studyMode);
    const back = getCardBack(currentCard, studyMode);
    const badge = getCardTypeBadge(currentCard.type);

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
            <BackButton />
            <h2>Learn</h2>

            <div style={{ position: 'relative', width: '400px', maxWidth: '90%', margin: '0 auto' }}>
                {/* Favorite button */}
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

                {/* Card type badge */}
                {badge && (
                    <div style={{
                        position: 'absolute', top: '10px', left: '10px', zIndex: 10,
                        background: badge.color, color: 'white',
                        fontSize: '11px', fontWeight: '600', padding: '2px 8px',
                        borderRadius: '999px',
                    }}>
                        {badge.label}
                    </div>
                )}

                {/* Flip card */}
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
                        {/* Front */}
                        <div style={{
                            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                            backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            padding: '20px', boxSizing: 'border-box',
                            border: '2px solid #333', borderRadius: '10px', backgroundColor: 'white',
                        }}>
                            <CardFrontContent front={front} />
                        </div>
                        {/* Back */}
                        <div style={{
                            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                            backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
                            transform: 'rotateY(180deg)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            padding: '20px', boxSizing: 'border-box',
                            border: '2px solid #333', borderRadius: '10px', backgroundColor: 'white',
                            overflowY: 'auto',
                        }}>
                            <CardBackContent back={back} />
                        </div>
                    </div>
                </div>

                {/* Knowledge level */}
                <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', color: '#666' }}>I</span>
                    <select
                        value={currentKnowledge}
                        onChange={(e) => handleKnowledgeChange(e.target.value)}
                        style={{
                            padding: '6px 10px', borderRadius: '8px',
                            border: `2px solid ${currentKnowledgeOption.color}`,
                            color: currentKnowledgeOption.color,
                            fontWeight: '600', fontSize: '13px',
                            background: 'white', cursor: 'pointer',
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