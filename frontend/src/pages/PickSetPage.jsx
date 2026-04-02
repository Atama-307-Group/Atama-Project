import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getLibraryContents, getFlashcardSetById } from '../api.js';
import './PickSetPage.css';

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

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [loadingSetId, setLoadingSetId] = useState(null);

    useEffect(() => {
        getLibraryContents()
            .then((data) => {
                // Combine loose items and folder items, filter to flashcard sets only
                const loose = Array.isArray(data.looseItems) ? data.looseItems : [];
                const all = loose.filter(
                    (item) => item.itemType === 'FLASHCARD_SET' || item.itemType === 'flashcard_set' || item.item_type === 'FLASHCARD_SET'
                );
                setItems(all);
            })
            .catch((e) => setError(e.message || 'Failed to load library'))
            .finally(() => setLoading(false));
    }, []);

    const handleSelectSet = async (item) => {
        setLoadingSetId(item.id);
        try {
            const setData = await getFlashcardSetById(item.id);
            navigate(MODE_DESTINATIONS[mode], {
                state: { flashcards: setData.flashcards, setTitle: setData.title },
            });
        } catch (e) {
            setError('Failed to load that set. Please try again.');
            setLoadingSetId(null);
        }
    };

    return (
        <div className="pick-set-page">
            <button className="pick-set-back" onClick={() => navigate('/')}>
                ← Back
            </button>

            <div className="pick-set-header">
                <h1>Choose a Set</h1>
                <p className="pick-set-subtitle">
                    Select a flashcard set to use for <strong>{MODE_LABELS[mode]}</strong>
                </p>
            </div>

            {loading && <div className="pick-set-state">Loading your library…</div>}
            {error && <div className="pick-set-state pick-set-error">{error}</div>}

            {!loading && !error && items.length === 0 && (
                <div className="pick-set-state">
                    <p>You don't have any flashcard sets yet.</p>
                    <button className="pick-set-create-btn" onClick={() => navigate('/create')}>
                        Create a Set
                    </button>
                </div>
            )}

            {!loading && items.length > 0 && (
                <div className="pick-set-grid">
                    {items.map((item) => {
                        const isLoading = loadingSetId === item.id;
                        return (
                            <button
                                key={item.id}
                                className={`pick-set-card ${isLoading ? 'pick-set-card--loading' : ''}`}
                                onClick={() => handleSelectSet(item)}
                                disabled={!!loadingSetId}
                            >
                                <span className="pick-set-card-title">{item.title}</span>
                                {isLoading && <span className="pick-set-spinner" />}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default PickSetPage;