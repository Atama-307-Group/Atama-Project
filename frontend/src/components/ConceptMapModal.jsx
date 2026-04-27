import React, { useState, useEffect } from 'react';
import { getLibraryContents, searchLibrary, getFlashcardSetById, generateConceptMap, createManualConceptMap } from '../api';
import './ConceptMapModal.css';
import AiDisabledModal from './AiDisabledModal.jsx';

const ConceptMapModal = ({ onClose, sourceSetId, defaultCards, aiDisabled }) => {
    const [step, setStep] = useState(1); // 1: picker, 2: progress
    const [loadingLibrary, setLoadingLibrary] = useState(true);
    const [librarySets, setLibrarySets] = useState([]);
    const [selectedCards, setSelectedCards] = useState(new Set());
    const [title, setTitle] = useState('');
    const [expandedSets, setExpandedSets] = useState(new Set([sourceSetId]));
    const [setDetailsCache, setSetDetailsCache] = useState({});
    
    // Generation state
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState(null);
    const [progressLabel, setProgressLabel] = useState("");
    const [generationMode, setGenerationMode] = useState(aiDisabled ? 'MANUAL' : 'AI'); // 'AI' or 'MANUAL'
    const [showAiModal, setShowAiModal] = useState(false);

    // Initialize with default cards (from the current set)
    useEffect(() => {
        if (defaultCards) {
            const initialSet = new Set();
            defaultCards.forEach(c => initialSet.add(c.id));
            setSelectedCards(initialSet);
        }
    }, [defaultCards]);

    useEffect(() => {
        async function fetchLib() {
            try {
                // Fetch library to show available source material
                const res = await getLibraryContents();
                // Filter just flashcard sets for picking cards
                const sets = res.looseItems.filter(i => i.itemType === 'FLASHCARD_SET');
                res.folders.forEach(f => {
                    if (f.items) {
                        sets.push(...f.items.filter(i => i.itemType === 'FLASHCARD_SET'));
                    }
                });
                
                // Add the source set if it's not in the list (e.g. public set)
                if (!sets.find(s => s.id === sourceSetId)) {
                    const sourceRes = await getFlashcardSetById(sourceSetId);
                    sets.unshift(sourceRes);
                    setSetDetailsCache(prev => ({ ...prev, [sourceSetId]: sourceRes }));
                }

                // Remove duplicates just in case
                const uniqueSets = Array.from(new Map(sets.map(s => [s.id, s])).values());
                setLibrarySets(uniqueSets);
            } catch (e) {
                console.error("Failed to load library", e);
            } finally {
                setLoadingLibrary(false);
            }
        }
        fetchLib();
    }, [sourceSetId]);

    const loadSetDetails = async (setId) => {
        if (setDetailsCache[setId]) return; // already loaded
        try {
            const data = await getFlashcardSetById(setId);
            setSetDetailsCache(prev => ({ ...prev, [setId]: data }));
        } catch (e) {
            console.error("Failed to load set", e);
        }
    };

    const toggleSetExpanded = (setId) => {
        setExpandedSets(prev => {
            const next = new Set(prev);
            if (next.has(setId)) {
                next.delete(setId);
            } else {
                next.add(setId);
                loadSetDetails(setId);
            }
            return next;
        });
    };

    const toggleCardSelected = (cardId) => {
        setSelectedCards(prev => {
            const next = new Set(prev);
            if (next.has(cardId)) next.delete(cardId);
            else next.add(cardId);
            return next;
        });
    };

    const toggleAllInSet = (setId, selectAll) => {
        const setDetail = setDetailsCache[setId];
        if (!setDetail) return;
        
        setSelectedCards(prev => {
            const next = new Set(prev);
            setDetail.flashcards.forEach(c => {
                if (selectAll) next.add(c.id);
                else next.delete(c.id);
            });
            return next;
        });
    };

    const handleGenerate = async () => {
        if (selectedCards.size === 0) {
            setError("Please select at least one card.");
            return;
        }
        if (generationMode === 'AI' && selectedCards.size > 100) {
            setError("Please select at most 100 cards for AI generation.");
            return;
        }
        setError(null);
        
        if (generationMode === 'MANUAL') {
            try {
                setIsGenerating(true);
                const cardIds = Array.from(selectedCards);
                const dto = await createManualConceptMap(sourceSetId, cardIds, title);
                setIsGenerating(false);
                window.location.href = `/concept-maps/${dto.id}?edit=true`;
            } catch (e) {
                setIsGenerating(false);
                setError(e.message || "Failed to create concept map.");
            }
            return;
        }
        
        setStep(2);
        setIsGenerating(true);
        
        const phases = ["Extracting terminology...", "Analyzing relationships...", "Structuring concept graph...", "Finalizing nodes..."];
        let pidx = 0;
        setProgressLabel(phases[0]);
        const interval = setInterval(() => {
            pidx = (pidx + 1) % phases.length;
            setProgressLabel(phases[pidx]);
        }, 3000);

        try {
            const cardIds = Array.from(selectedCards);
            const dto = await generateConceptMap(sourceSetId, cardIds, title);
            clearInterval(interval);
            setIsGenerating(false);
            
            // Redirect to the new concept map page
            window.location.href = `/concept-maps/${dto.id}`;
        } catch (e) {
            clearInterval(interval);
            setIsGenerating(false);
            setError(e.message || "Failed to generate concept map.");
            setStep(1); // Go back to picker
        }
    };

    return (
        <div className="cmap-modal-overlay" onClick={onClose}>
            <div className="cmap-modal" onClick={e => e.stopPropagation()}>
                <button className="cmap-modal-close" onClick={onClose}>✕</button>
                
                {step === 1 && (
                    <>
                        <h2 className="cmap-modal-title">🧠 Create Concept Map</h2>
                        <p className="cmap-modal-subtitle">Pick material from your library to include in the map.</p>
                        
                        <div className="cmap-toggle-group">
                            <label 
                                className={`cmap-toggle-label ${generationMode === 'AI' ? 'active' : ''}`}
                                onClick={(e) => {
                                    if (aiDisabled) {
                                        e.preventDefault();
                                        setShowAiModal(true);
                                    }
                                }}
                                style={{ opacity: aiDisabled ? 0.5 : 1, cursor: aiDisabled ? 'not-allowed' : 'pointer' }}
                            >
                                <input 
                                    type="radio" 
                                    value="AI" 
                                    checked={generationMode === 'AI'} 
                                    onChange={() => {
                                        if (!aiDisabled) setGenerationMode('AI');
                                    }} 
                                    style={{display: 'none'}} 
                                />
                                ✨ Generate with AI
                            </label>
                            <label className={`cmap-toggle-label ${generationMode === 'MANUAL' ? 'active' : ''}`}>
                                <input type="radio" value="MANUAL" checked={generationMode === 'MANUAL'} onChange={() => setGenerationMode('MANUAL')} style={{display: 'none'}} />
                                🤚 Create Your Own
                            </label>
                        </div>

                        <input 
                            className="cmap-input" 
                            placeholder="Concept Map Title (optional)"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                        
                        {error && <div className="cmap-error">{error}</div>}

                        <div className="cmap-library-picker">
                            {loadingLibrary ? <div className="cmap-loading">Loading library...</div> : (
                                librarySets.map(set => {
                                    const expanded = expandedSets.has(set.id);
                                    const detailsLoaded = !!setDetailsCache[set.id];
                                    const flashcards = detailsLoaded ? setDetailsCache[set.id].flashcards || [] : 
                                                       (set.id === sourceSetId ? defaultCards : []);
                                                       
                                    // Calculate if all/none/some are selected
                                    let selectedCount = 0;
                                    flashcards.forEach(c => {
                                        if (selectedCards.has(c.id)) selectedCount++;
                                    });
                                    const allSelected = flashcards.length > 0 && selectedCount === flashcards.length;

                                    return (
                                        <div key={set.id} className="cmap-set-group">
                                            <div className="cmap-set-header" onClick={() => toggleSetExpanded(set.id)}>
                                                <span className="cmap-set-chevron">{expanded ? '▼' : '▶'}</span>
                                                <span className="cmap-set-title">{set.title || set.name}</span>
                                                <span className="cmap-badge">{detailsLoaded ? flashcards.length : '?'} cards</span>
                                                <span className="cmap-selected-count">{selectedCount} selected</span>
                                            </div>
                                            
                                            {expanded && (
                                                <div className="cmap-set-cards">
                                                    {!detailsLoaded && <div className="cmap-loading-small">Loading cards...</div>}
                                                    {detailsLoaded && flashcards.length === 0 && <div className="cmap-loading-small">No cards</div>}
                                                    {detailsLoaded && flashcards.length > 0 && (
                                                        <div className="cmap-select-all">
                                                            <label>
                                                                <input 
                                                                    type="checkbox" 
                                                                    checked={allSelected}
                                                                    onChange={(e) => toggleAllInSet(set.id, e.target.checked)}
                                                                />
                                                                <span>Select All</span>
                                                            </label>
                                                        </div>
                                                    )}
                                                    {detailsLoaded && flashcards.map(card => (
                                                        <label key={card.id} className="cmap-card-item">
                                                            <input 
                                                                type="checkbox" 
                                                                checked={selectedCards.has(card.id)}
                                                                onChange={() => toggleCardSelected(card.id)}
                                                            />
                                                            <span className="cmap-card-term">{card.term}</span>
                                                            <span className="cmap-card-def">{card.definition}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })
                            )}
                        </div>
                        
                        <div className="cmap-modal-footer">
                            <span className="cmap-total-selected">Total selected: {selectedCards.size} cards</span>
                            <div className="cmap-actions">
                                <button className="cmap-btn cmap-btn-cancel" onClick={onClose}>Cancel</button>
                                <button className="cmap-btn cmap-btn-primary" onClick={handleGenerate} disabled={selectedCards.size === 0 || isGenerating}>
                                    {isGenerating ? 'Working...' : (generationMode === 'AI' ? 'Generate ✨' : 'Create Map')}
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {step === 2 && (
                    <div className="cmap-generating-wrap">
                        <div className="cmap-spinner"></div>
                        <h2 className="cmap-modal-title">Generating Graph</h2>
                        <p className="cmap-modal-subtitle">{progressLabel}</p>
                    </div>
                )}
            </div>
            {showAiModal && <AiDisabledModal onClose={() => setShowAiModal(false)} />}
        </div>
    );
};

export default ConceptMapModal;
