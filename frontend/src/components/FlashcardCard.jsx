import React from 'react';
import './FlashcardCard.css';

const KNOWLEDGE_BADGES = {
    DONT_KNOW:     { label: "Don't Know", className: 'flashcard-card-knowledge--red' },
    KNOW_SOMEWHAT: { label: 'Know Somewhat', className: 'flashcard-card-knowledge--yellow' },
    KNOW_WELL:     { label: 'Know Well', className: 'flashcard-card-knowledge--green' },
};

const FlashcardCard = ({ index, card, knowledgeLevel }) => {
    const badge = KNOWLEDGE_BADGES[knowledgeLevel] ?? KNOWLEDGE_BADGES.DONT_KNOW;

    const renderFields = () => {
        switch (card.type) {
            case 'NORMAL':
                return (
                    <>
                        <div className="flashcard-card-field">
                            <span className="flashcard-card-label">Term</span>
                            <div className="flashcard-card-value">{card.term || '—'}</div>
                        </div>
                        <div className="flashcard-card-field">
                            <span className="flashcard-card-label">Definition</span>
                            <div className="flashcard-card-value">{card.definition || '—'}</div>
                        </div>
                    </>
                );
            case 'FILL_BLANK':
                return (
                    <>
                        <div className="flashcard-card-field">
                            <span className="flashcard-card-label">Text</span>
                            <div className="flashcard-card-value">{card.textWithBlanks || '—'}</div>
                        </div>
                        <div className="flashcard-card-field">
                            <span className="flashcard-card-label">Correct Answers</span>
                            <ol className="flashcard-card-list">
                                {(card.correctAnswers || []).map((a, i) => <li key={i}>{a}</li>)}
                            </ol>
                        </div>
                    </>
                );
            case 'DRAG_DROP':
                return (
                    <>
                        {card.imageUrl && (
                            <div className="flashcard-card-field">
                                <img src={card.imageUrl} alt="Drag and drop" className="flashcard-card-image" />
                            </div>
                        )}
                        {card.prompt && (
                            <div className="flashcard-card-field">
                                <span className="flashcard-card-label">Prompt</span>
                                <div className="flashcard-card-value">{card.prompt}</div>
                            </div>
                        )}
                        {card.draggableLabels?.length > 0 && (
                            <div className="flashcard-card-field">
                                <span className="flashcard-card-label">Labels</span>
                                <div className="flashcard-card-tags">
                                    {card.draggableLabels.map((l, i) => <span key={i} className="flashcard-card-tag">{l}</span>)}
                                </div>
                            </div>
                        )}
                    </>
                );
            case 'STEPS':
                return (
                    <>
                        <div className="flashcard-card-field">
                            <span className="flashcard-card-label">Title</span>
                            <div className="flashcard-card-value">{card.title || '—'}</div>
                        </div>
                        <div className="flashcard-card-field">
                            <span className="flashcard-card-label">Steps</span>
                            <ol className="flashcard-card-list">
                                {(card.steps || []).map((s, i) => <li key={i}>{s}</li>)}
                            </ol>
                        </div>
                    </>
                );
            default:
                return <div className="flashcard-card-value">Unsupported card type: {card.type}</div>;
        }
    };

    return (
        <div className="flashcard-card">
            <div className="flashcard-card-header">
                <span className="flashcard-card-number">{index + 1}</span>
                <span className="flashcard-card-type">{card.type?.replace('_', ' ')}</span>
                <span className={`flashcard-card-type flashcard-card-knowledge ${badge.className}`}>
                    {badge.label}
                </span>
            </div>
            <div className="flashcard-card-fields">
                {renderFields()}
            </div>
        </div>
    );
};

export default FlashcardCard;