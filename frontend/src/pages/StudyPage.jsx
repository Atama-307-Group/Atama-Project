import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './StudyPage.css';
import { useEffect } from "react";
import { startStudying, stopStudying } from "../api.js";

const StudyPage = ({ onToggleFavorite, userId }) => {
    const location = useLocation();
    const navigate = useNavigate();

    // 1. Safely extract the state passed from PreLearnPage
    const studyMode = location.state?.frontChoice || 'term';
    const initialFlashcards = location.state?.cards || [];

    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [flippedCards, setFlippedCards] = useState(new Set());
    const [cards, setCards] = useState(initialFlashcards);

    // 2. SAFETY CHECK: If no cards found, prevent crashes
    if (!cards || cards.length === 0) {
        return (
            <div style={{ textAlign: 'center', marginTop: '100px' }}>
                <h2>No cards found for this session.</h2>
                <button onClick={() => navigate('/')}>Return Home</button>
            </div>
        );
    }

    // 3. Define current card and content logic AFTER state initialization
    const currentCard = cards[currentIndex];
    const isFITB = currentCard.type === 'FILL_BLANK';

    // For FITB: Front is the text with underscores, Back is the answer list joined by commas
    // For REGULAR: Logic follows the studyMode (Term vs Definition)
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

    const handleNext = () => {
        setIsFlipped(false);
        setCurrentIndex((prev) => (prev + 1) % cards.length);
    };

    const handlePrev = () => {
        setIsFlipped(false);
        setCurrentIndex((prev) => (prev === 0 ? cards.length - 1 : prev - 1));
    };

    const handleDone = () => {
        navigate('/post_learn', {
            state: { studiedCount: flippedCards.size, totalCount: cards.length }
        });
    };

    const handleToggleFavorite = (e) => {
        e.stopPropagation(); // prevent card flip
        if (onToggleFavorite) onToggleFavorite(currentCard.id);

        // Update local state so the UI star changes immediately
        setCards(prev =>
            prev.map(c => c.id === currentCard.id ? { ...c, favorite: !c.favorite } : c)
        );
    };

    const handleReset = () => {
        setIsFlipped(false);
        setCurrentIndex(0);
    }

    useEffect(() => {
        console.log("StudyPage userId:", userId);
        if (!userId) return;

        startStudying(userId).catch(console.error);

        return () => {
            // This cleanup runs when the user navigates away
            stopStudying(userId).catch(console.error);
        };
    }, [userId]);

// Stops studying when user closes the tab
    useEffect(() => {
        const handleUnload = () => stopStudying(userId).catch(console.error);
        window.addEventListener("beforeunload", handleUnload);
        return () => window.removeEventListener("beforeunload", handleUnload);
    }, [userId]);

    return (
        <div style={{ maxWidth: '500px', margin: '50px auto', textAlign: 'center' }}>
            <h2>Learn</h2>

            <div style={{ position: 'relative', display: 'inline-block' }}>
                {/* ⭐ Favorite Star */}
                <button
                    onClick={handleToggleFavorite}
                    title="Favorite"
                    style={{
                        position: 'absolute',
                        top: '10px',
                        right: '24px',
                        zIndex: 10,
                        background: 'none',
                        border: 'none',
                        fontSize: '24px',
                        cursor: 'pointer',
                        color: currentCard.favorite ? '#f5c518' : '#ccc',
                        transition: 'color 0.2s',
                    }}
                >
                    {currentCard.favorite ? '★' : '☆'}
                </button>

                <div className="card-container" onClick={handleFlip}>
                    <div className={`card ${isFlipped ? 'flipped' : ''}`}>
                        <div className="front">{frontContent}</div>
                        <div className="back">{backContent}</div>
                    </div>
                </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
                <button onClick={handlePrev} style={{ marginRight: '10px' }}>Previous</button>
                <button onClick={handleNext}>Next</button>
                <button onClick={handleReset} style ={{ marginLeft: '10px' }} disabled={currentIndex === 0}>Return To Beginning</button>
            </div>

            <p>Card {currentIndex + 1} of {cards.length}</p>

            <button onClick={handleDone} style={{ padding: '10px 20px', cursor: 'pointer', borderRadius: '5px' }}>
                Finish Session
            </button>
        </div>
    );
};

export default StudyPage;