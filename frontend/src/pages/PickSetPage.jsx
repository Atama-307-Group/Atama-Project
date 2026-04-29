import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getLibraryContents, getFlashcardSetById } from '../api.js';
import './PickSetPage.css';
import BackButton from '../components/BackButton.jsx';

const MODE_LABELS = {
    learn: 'Learn',
    match: 'Match',
    test: 'Practice Test',
};

const MODE_DESTINATIONS = {
    learn: '/pre_learn',
    match: '/pre_match',
    test: '/pre_test',
};

const PickSetPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const mode = searchParams.get('mode') || 'learn';
    const isTestMode = mode.startsWith('test');
    const isAiTestMode = mode === 'test-ai';

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [loadingSetId, setLoadingSetId] = useState(null);
    const [selectedItems, setSelectedItems] = useState(new Set());

    useEffect(() => {
        getLibraryContents()
            .then((data) => {
                let allItems = [];
                if (data.looseItems && Array.isArray(data.looseItems)) {
                    allItems.push(...data.looseItems);
                }
                if (data.folders && Array.isArray(data.folders)) {
                    data.folders.forEach(folder => {
                        if (folder.items && Array.isArray(folder.items)) {
                            allItems.push(...folder.items);
                        }
                    });
                }
                
                // Test mode can select flashcard sets
                // If test-ai, allow documents/PDFs too
                const filtered = allItems.filter((item) => {
                    const t = item.itemType || item.item_type;
                    if (isTestMode) {
                        if (isAiTestMode) {
                            return t === 'FLASHCARD_SET' || t === 'flashcard_set' || t === 'PDF' || t === 'DOCUMENT';
                        }
                        return t === 'FLASHCARD_SET' || t === 'flashcard_set';
                    }
                    return t === 'FLASHCARD_SET' || t === 'flashcard_set';
                });
                setItems(filtered);
            })
            .catch((e) => setError(e.message || 'Failed to load library'))
            .finally(() => setLoading(false));
    }, [isTestMode]);

    const handleItemClick = async (item) => {
        if (isTestMode) {
            setSelectedItems(prev => {
                const next = new Set(prev);
                if (next.has(item)) next.delete(item);
                else next.add(item);
                return next;
            });
            return;
        }

        // Learn / Match mode: single select
        setLoadingSetId(item.id);
        try {
            const setData = await getFlashcardSetById(item.id);
            navigate(MODE_DESTINATIONS[mode], {
                state: { flashcards: setData.flashcards, setTitle: setData.title, setId: item.id },
            });
        } catch (e) {
            setError('Failed to load that set. Please try again.');
            setLoadingSetId(null);
        }
    };

    const handleNextClick = () => {
        const arr = Array.from(selectedItems);
        navigate('/pre_test', {
            state: { selectedItems: arr, forceManual: !isAiTestMode }
        });
    };

    return (
        <div className="pick-set-page">
            <BackButton />

            <div className="pick-set-header">
                <h1>{isTestMode ? 'Select Study Materials' : 'Choose a Set'}</h1>
                <p className="pick-set-subtitle">
                    Select {isTestMode ? 'one or more items' : 'a flashcard set'} to use for <strong>{isTestMode ? 'Practice Test' : MODE_LABELS[mode]}</strong>
                </p>
            </div>

            {loading && <div className="pick-set-state">Loading your library…</div>}
            {error && <div className="pick-set-state pick-set-error">{error}</div>}

            {!loading && !error && items.length === 0 && !isTestMode && (
                <div className="pick-set-state">
                    <p>You don't have any flashcard sets yet.</p>
                    <button className="pick-set-create-btn" onClick={() => navigate('/create')}>
                        Create a Set
                    </button>
                </div>
            )}

            {!loading && (
                <>
                    <div className="pick-set-grid">
                        {items.length > 0 && items.map((item) => {
                            const isLoading = loadingSetId === item.id;
                            const isSelected = selectedItems.has(item);
                            return (
                                <button
                                    key={item.id}
                                    className={`pick-set-card ${isLoading ? 'pick-set-card--loading' : ''} ${isSelected ? 'pick-set-card--selected' : ''}`}
                                    onClick={() => handleItemClick(item)}
                                    disabled={!!loadingSetId}
                                    style={{
                                        border: isSelected ? '2px solid #55916f' : '',
                                        backgroundColor: isSelected ? '#eefbf3' : '',
                                        flexDirection: 'column',
                                        justifyContent: 'center',
                                        textAlign: 'center'
                                    }}
                                >
                                    <span className="pick-set-card-title" style={{ marginTop: isTestMode ? '10px' : '0' }}>{item.title}</span>
                                    {isTestMode && <span style={{fontSize: '10px', backgroundColor: '#eee', padding: '2px 6px', borderRadius: '4px', color: '#666', marginTop: '8px'}}>{item.itemType}</span>}
                                    {isLoading && <span className="pick-set-spinner" style={{ marginTop: '5px' }} />}
                                </button>
                            );
                        })}
                    </div>
                </>
            )}

            {isTestMode && !loading && (
                <div style={{marginTop: '20px', textAlign: 'center'}}>
                    <button 
                        onClick={handleNextClick}
                        className="pick-set-create-btn"
                        style={{
                            padding: '12px 30px', 
                            fontSize: '1.2rem', 
                            opacity: selectedItems.size === 0 ? 0.6 : 1, 
                            cursor: selectedItems.size === 0 ? 'not-allowed' : 'pointer'
                        }}
                        disabled={selectedItems.size === 0}
                    >
                        {selectedItems.size > 0 ? `Continue with ${selectedItems.size} items` : 'Select items to continue'}
                     </button>
                </div>
            )}
        </div>
    );
};

export default PickSetPage;