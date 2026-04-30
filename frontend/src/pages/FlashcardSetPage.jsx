import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    generateSharedLink,
    getFlashcardSetById,
    updateFlashcardSetMeta,
    updateFlashcard,
    addFlashcard,
    deleteFlashcard,
    getSetProgress,
    getSetStats,
    saveSet,
    unsaveSet,
    updateSetPrivacy,
    getMyReview,
    upsertReview,
    deleteReview,
    hostGame,
} from "../api.js";
import FlashcardCard from "../components/FlashcardCard.jsx";
import FlashcardInput from "../components/FlashcardInput.jsx";
import BackButton from "../components/BackButton.jsx";
import ConceptMapModal from "../components/ConceptMapModal.jsx";
import "./FlashcardSetPage.css";
import ReportModal from '../components/ReportModal';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const formatSeconds = (s) => {
    if (!s || s === 0) return '0 min';
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m} min`;
    return `${s}s`;
};

const formatDate = (instant) => {
    if (!instant) return '—';
    return new Date(instant).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

const TAGS = [
    { value: 'WELL_ORGANIZED',         label: 'Well Organized',         positive: true },
    { value: 'COVERS_EXAM_CONTENT',    label: 'Covers Exam Content',    positive: true },
    { value: 'EASY_TO_STUDY',          label: 'Easy to Study',          positive: true },
    { value: 'COVERS_LECTURE_CONTENT', label: 'Covers Lecture Content', positive: true },
    { value: 'OUTDATED',               label: 'Outdated',               positive: false },
    { value: 'NOT_ENOUGH_CONTENT',     label: 'Not Enough Content',     positive: false },
    { value: 'POORLY_ORGANIZED',       label: 'Poorly Organized',       positive: false },
    { value: 'TOO_SIMPLE',             label: 'Too Simple',             positive: false },
    { value: 'TOO_COMPLEX',            label: 'Too Complex',            positive: false },
];

const TAG_LABEL    = Object.fromEntries(TAGS.map(t => [t.value, t.label]));
const TAG_POSITIVE = Object.fromEntries(TAGS.map(t => [t.value, t.positive]));

const StarPicker = ({ value, onChange }) => (
    <div className="review-stars">
        {[1, 2, 3, 4, 5].map(n => (
            <button
                key={n}
                type="button"
                className={`review-star ${n <= value ? 'review-star--filled' : ''}`}
                onClick={() => onChange(n)}
                aria-label={`${n} star${n !== 1 ? 's' : ''}`}
            >★</button>
        ))}
    </div>
);

const FlashcardSetPage = ({ currentUser }) => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [setData, setSetData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [editingId, setEditingId] = useState(null);
    const [editDraft, setEditDraft] = useState(null);
    const [editingMeta, setEditingMeta] = useState(false);
    const [showAddCard, setShowAddCard] = useState(false);
    const [newCardDraft, setNewCardDraft] = useState({ type: 'NORMAL', term: '', definition: '' });
    const [addCardError, setAddCardError] = useState('');
    const [metaDraft, setMetaDraft] = useState({ title: '', description: '', university: '', course: '' });
    const [shareStatus, setShareStatus] = useState(null);
    const [shareUrl, setShareUrl] = useState('');
    const [downloadStatus, setDownloadStatus] = useState(null);
    const [showDownloadOptions, setShowDownloadOptions] = useState(false);

    // Progress
    const [progressMap, setProgressMap] = useState({});
    const [stats, setStats] = useState(null);
    const [showStats, setShowStats] = useState(false);

    // Reviews
    const [myReview, setMyReview] = useState(null);
    const [showReview, setShowReview] = useState(false);
    const [reviewStars, setReviewStars] = useState(0);
    const [reviewTags, setReviewTags] = useState([]);
    const [reviewSubmitting, setReviewSubmitting] = useState(false);
    const [reviewError, setReviewError] = useState('');
    const [averageRating, setAverageRating] = useState(null);
    const [topTags, setTopTags] = useState([]);
    const [reviewCount, setReviewCount] = useState(0);

    // Concept Map Modal
    const [showConceptMapModal, setShowConceptMapModal] = useState(false);

    const [showReport, setShowReport] = useState(false);

    useEffect(() => {
        if (!UUID_REGEX.test(id)) { setError("Invalid flashcard set."); setLoading(false); return; }
        Promise.all([
            getFlashcardSetById(id),
            getSetProgress(id).catch(() => []),
            getSetStats(id).catch(() => null),
            getMyReview(id).catch(() => null),
        ]).then(([setResult, progressResult, statsResult, reviewResult]) => {
            setSetData(setResult);
            setAverageRating(setResult.averageRating ?? null);
            setTopTags(setResult.topTags ?? []);
            setReviewCount(setResult.reviewCount ?? 0);

            const map = {};
            (progressResult || []).forEach(p => {
                const cardId = p.flashcard?.id ?? p.flashcardId;
                if (cardId) map[cardId] = p.knowledgeLevel;
            });
            setProgressMap(map);
            setStats(statsResult);

            if (reviewResult) {
                setMyReview(reviewResult);
                setReviewStars(reviewResult.stars);
                setReviewTags(reviewResult.tags ?? []);
            }
        }).catch((e) => setError(e.message ?? "Failed to load flashcard set."))
          .finally(() => setLoading(false));
    }, [id]);

    const isOwner = currentUser && setData && currentUser.id === setData.ownerId?.toString();

    const refreshAggregate = async () => {
        const fresh = await getFlashcardSetById(id);
        setAverageRating(fresh.averageRating ?? null);
        setTopTags(fresh.topTags ?? []);
        setReviewCount(fresh.reviewCount ?? 0);
    };

    const openReviewModal = () => {
        if (myReview) { setReviewStars(myReview.stars); setReviewTags(myReview.tags ?? []); }
        else { setReviewStars(0); setReviewTags([]); }
        setReviewError('');
        setShowReview(true);
    };

    const toggleTag = (tag) => {
        setReviewTags(prev => {
            if (prev.includes(tag)) return prev.filter(t => t !== tag);
            if (prev.length >= 3) return prev;
            return [...prev, tag];
        });
    };

    const handleSubmitReview = async () => {
        if (reviewStars === 0) { setReviewError('Please select a star rating.'); return; }
        setReviewSubmitting(true);
        setReviewError('');
        try {
            const saved = await upsertReview(id, reviewStars, reviewTags);
            setMyReview(saved);
            setShowReview(false);
            await refreshAggregate();
        } catch (e) {
            setReviewError(e.message || 'Failed to submit review.');
        } finally {
            setReviewSubmitting(false);
        }
    };

    const handleDeleteReview = async () => {
        if (!window.confirm('Delete your review?')) return;
        try {
            await deleteReview(id);
            setMyReview(null); setReviewStars(0); setReviewTags([]);
            setShowReview(false);
            await refreshAggregate();
        } catch (e) {
            setReviewError(e.message || 'Failed to delete review.');
        }
    };

    const startEditing = (card, index) => { setEditingId(card.id ?? index); setEditDraft({ ...card }); };
    const cancelEditing = () => { setEditingId(null); setEditDraft(null); };

    const saveCard = async (index) => {
        const updated = await updateFlashcard(id, editDraft.id, editDraft);
        setSetData((prev) => ({ ...prev, flashcards: prev.flashcards.map((c, i) => i === index ? updated : c) }));
        setEditingId(null); setEditDraft(null);
    };

    const deleteCard = async (cardId) => {
        if (!window.confirm('Delete this card?')) return;
        try {
            const updated = await deleteFlashcard(id, cardId);
            setSetData(prev => ({ ...updated, isOwner: prev.isOwner, isSaved: prev.isSaved }));
        } catch (e) {
            alert(e.message || 'Failed to delete card.');
        }
    };

    const openAddCard = () => {
        setNewCardDraft({ type: 'NORMAL', term: '', definition: '' });
        setAddCardError('');
        setShowAddCard(true);
    };

    const cancelAddCard = () => { setShowAddCard(false); setAddCardError(''); };

    const handleAddCard = async () => {
        setAddCardError('');
        try {
            const updated = await addFlashcard(id, newCardDraft);
            setSetData(prev => ({ ...updated, isOwner: prev.isOwner, isSaved: prev.isSaved }));
            setShowAddCard(false);
        } catch (e) {
            setAddCardError(e.message || 'Failed to add card.');
        }
    };

    const startEditingMeta = () => {
        setMetaDraft({ title: setData.title, description: setData.description ?? '', university: setData.university ?? '', course: setData.course ?? '' });
        setEditingMeta(true);
    };
    const cancelEditingMeta = () => setEditingMeta(false);
    const saveMeta = async () => {
        const updated = await updateFlashcardSetMeta(id, metaDraft);
        setSetData((prev) => ({ ...prev, ...updated }));
        setEditingMeta(false);
    };

    const downloadSet = (format) => {
        try {
            const content = generateFileContent(setData.flashcards, format);
            if (!content) throw new Error("No content");
            const filename = `${setData.title.replace(/\s+/g, '_')}.${format}`;
            const blob = new Blob([content], { type: 'text/plain' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            document.body.appendChild(link); link.click();
            document.body.removeChild(link); URL.revokeObjectURL(link.href);
            setDownloadStatus('Flashcard set downloaded!');
            setTimeout(() => setDownloadStatus(null), 3000);
        } catch { setDownloadStatus('Download failed.'); setTimeout(() => setDownloadStatus(null), 3000); }
    };

    const handleShare = async () => {
        try {
            const { token } = await generateSharedLink(setData.id);
            const url = `${window.location.origin}/shared/${token}`;
            setShareUrl(url);
            await navigator.clipboard.writeText(url);
            setShareStatus('Link copied to clipboard!');
        } catch { setShareStatus('Failed to generate/copy link.'); }
        finally { setTimeout(() => setShareStatus(null), 3000); }
    };

    const handleSaveToggle = async () => {
        if (setData.isSaved) {
            await unsaveSet(id);
            setSetData(prev => ({ ...prev, isSaved: false }));
        } else {
            await saveSet(id);
            setSetData(prev => ({ ...prev, isSaved: true }));
        }
    };

    const handlePrivacyToggle = async () => {
        const updated = await updateSetPrivacy(id, !setData.isPublic);
        setSetData(prev => ({ ...prev, isPublic: updated.isPublic }));
    };

    const handleStudyMode = (mode) => {
        const destinations = { learn: '/pre_learn', match: '/pre_match', test: '/pre_test' };
        let stateObj = { flashcards: setData.flashcards, setTitle: setData.title, setId: id };
        if (mode === 'test') {
            stateObj.selectedItems = [{ id, title: setData.title, itemType: 'FLASHCARD_SET' }];
            stateObj.forceManual = true;
        }
        navigate(destinations[mode], { state: stateObj });
    };

    const handleHostGame = async () => {
        try {
            const { joinCode } = await hostGame(id);
            navigate(`/game/host/${joinCode}`);
        } catch (e) {
            alert('Failed to host game');
        }
    };

    const percentKnowWell = stats?.percentKnowWell ?? 0;

    if (loading) return <div className="set-page-loading">Loading...</div>;
    if (error)   return <div className="set-page-error">{error}</div>;

    return (
        <div className="set-page">
            <div className="set-page-top-bar">
                <BackButton />
                {!isOwner && setData && (
                    <button className="set-page-report-btn" onClick={() => setShowReport(true)} title="Report this set">
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
                            <line x1="4" y1="22" x2="4" y2="15"/>
                        </svg>
                        Report
                    </button>
                )}
            </div>

            <div className="set-page-progress-bar-wrap">
                <div className="set-page-progress-bar-labels"><span>Progress</span><span>{percentKnowWell}% Know Well</span></div>
                <div className="set-page-progress-bar-track">
                    <div className="set-page-progress-bar-fill" style={{ width: `${percentKnowWell}%` }} />
                </div>
            </div>

            {editingMeta ? (
                <div className="set-page-meta-edit">
                    <input className="set-page-meta-title-input" value={metaDraft.title} onChange={(e) => setMetaDraft(d => ({ ...d, title: e.target.value }))} placeholder="Title" />
                    <textarea className="set-page-meta-description-input" value={metaDraft.description} onChange={(e) => setMetaDraft(d => ({ ...d, description: e.target.value }))} placeholder="Description (optional)" rows={2} />
                    <input className="set-page-meta-description-input" value={metaDraft.university} onChange={(e) => setMetaDraft(d => ({ ...d, university: e.target.value }))} placeholder="University (optional)" />
                    <input className="set-page-meta-description-input" value={metaDraft.course} onChange={(e) => setMetaDraft(d => ({ ...d, course: e.target.value }))} placeholder="Course (optional)" />
                    <div className="set-page-edit-actions">
                        <button className="set-page-cancel-btn" onClick={cancelEditingMeta}>Cancel</button>
                        <button className="set-page-save-btn" disabled={!metaDraft.title.trim()} onClick={saveMeta}>Save</button>
                    </div>
                </div>
            ) : (
                <div className="set-page-meta">
                    <h1>{setData.title}</h1>
                    {setData.description && <p className="set-page-description">{setData.description}</p>}
                    {setData.university && <p className="set-page-meta-sub">{setData.university}{setData.course ? ` · ${setData.course}` : ''}</p>}

                    {/* Rating row */}
                    <div className="set-page-rating-row">
                        {averageRating !== null ? (
                            <span className="set-page-avg-rating">
                                ★ {averageRating.toFixed(1)}
                                <span className="set-page-review-count">({reviewCount} review{reviewCount !== 1 ? 's' : ''})</span>
                            </span>
                        ) : (
                            <span className="set-page-avg-rating set-page-avg-rating--none">★ No reviews yet</span>
                        )}
                        {topTags.length > 0 && (
                            <div className="set-page-top-tags">
                                {topTags.map(tag => (
                                    <span key={tag} className={`set-page-top-tag ${TAG_POSITIVE[tag] ? 'set-page-top-tag--pos' : 'set-page-top-tag--neg'}`}>
                                        {TAG_LABEL[tag] ?? tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="set-page-study-actions">
                        <button className="set-page-study-btn" onClick={() => setShowConceptMapModal(true)}>🧠 Concept Map</button>
                        <button className="set-page-study-btn" onClick={() => handleStudyMode('learn')}>📖 Learn</button>
                        <button className="set-page-study-btn" onClick={() => handleStudyMode('match')}>🔀 Match</button>
                        <button className="set-page-study-btn" onClick={() => handleStudyMode('test')}>📝 Practice Test</button>
                        <button className="set-page-study-btn" onClick={handleHostGame} style={{ background: '#46178f', color: 'white' }}>🎮 Host Game</button>
                        <button className="set-page-study-btn set-page-study-btn--stats" onClick={() => setShowStats(true)}>📊 View Statistics</button>
                    </div>

                    <div className="set-page-meta-actions">
                        {setData.isOwner && (
                            <button className="set-page-edit-btn" onClick={startEditingMeta}>Edit title & description</button>
                        )}
                        {!setData.isOwner && (
                            <button className="set-page-edit-btn" onClick={handleSaveToggle}>
                                {setData.isSaved ? '✓ Saved' : '+ Save to Library'}
                            </button>
                        )}
                        <button className="set-page-edit-btn" onClick={handleShare}>Share Set</button>
                        <div className="download-container">
                            <button className="set-page-edit-btn" onClick={() => setShowDownloadOptions(!showDownloadOptions)}>Download</button>
                            {showDownloadOptions && (
                                <div className="download-dropdown">
                                    <button onClick={() => { downloadSet('csv'); setShowDownloadOptions(false); }}>CSV file</button>
                                    <button onClick={() => { downloadSet('txt'); setShowDownloadOptions(false); }}>TXT file</button>
                                </div>
                            )}
                        </div>
                        {setData.isOwner && (
                            <button className="set-page-edit-btn" onClick={handlePrivacyToggle}>
                                {setData.isPublic ? '🔒 Make Private' : '🔓 Make Public'}
                            </button>
                        )}
                        {!isOwner && (
                            <button className="set-page-edit-btn" onClick={openReviewModal}>
                                {myReview ? 'Edit Review' : 'Review'}
                            </button>
                        )}
                    </div>

                    {shareStatus && (
                        <div className={`set-page-toast ${shareStatus.includes('failed') ? 'error' : 'success'}`}>
                            {shareStatus}
                            {shareUrl && !shareStatus.includes('failed') && <a href={shareUrl} target="_blank" rel="noreferrer" className="set-page-toast-link">{shareUrl}</a>}
                        </div>
                    )}
                    {downloadStatus && <div className={`set-page-toast ${downloadStatus.includes('failed') ? 'error' : 'success'}`}>{downloadStatus}</div>}
                </div>
            )}

            <h2>Cards ({setData.flashcards?.length ?? 0})</h2>

            {setData.flashcards?.length ? (
                <div className="set-page-cards">
                    {setData.flashcards.map((card, index) => {
                        const cardKey = card.id ?? index;
                        const isEditing = editingId === cardKey;
                        const level = progressMap[card.id] ?? 'DONT_KNOW';
                        return isEditing ? (
                            <div key={cardKey} className="set-page-editing-card">
                                <FlashcardInput index={index} card={editDraft} onChange={(i, updated) => setEditDraft(updated)} onRemove={() => {}} canRemove={false} showRemove={false} />
                                <div className="set-page-edit-actions">
                                    <button className="set-page-cancel-btn" onClick={cancelEditing}>Cancel</button>
                                    <button className="set-page-save-btn" onClick={() => saveCard(index)}>Save</button>
                                </div>
                            </div>
                        ) : (
                            <div key={cardKey} className="set-page-card-wrap">
                                <FlashcardCard index={index} card={card} knowledgeLevel={level} />
                                {setData.isOwner && (
                                    <div className="set-page-card-actions">
                                        <button className="set-page-edit-btn" onClick={() => startEditing(card, index)}>Edit</button>
                                        <button className="set-page-delete-btn" onClick={() => deleteCard(card.id)}>Delete</button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : <p>No cards in this set.</p>}

            {setData.isOwner && (
                showAddCard ? (
                    <div className="set-page-editing-card">
                        <FlashcardInput
                            index={setData.flashcards?.length ?? 0}
                            card={newCardDraft}
                            onChange={(i, updated) => setNewCardDraft(updated)}
                            onRemove={() => {}}
                            canRemove={false}
                            showRemove={false}
                        />
                        {addCardError && <p className="set-page-add-card-error">{addCardError}</p>}
                        <div className="set-page-edit-actions">
                            <button className="set-page-cancel-btn" onClick={cancelAddCard}>Cancel</button>
                            <button className="set-page-save-btn" onClick={handleAddCard}>Add Card</button>
                        </div>
                    </div>
                ) : (
                    <button className="set-page-add-card-btn" onClick={openAddCard}>+ Add Card</button>
                )
            )}

            {/* Stats modal */}
            {showStats && (
                <div className="set-page-modal-overlay" onClick={() => setShowStats(false)}>
                    <div className="set-page-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="set-page-modal-close" onClick={() => setShowStats(false)}>✕</button>
                        <h2 className="set-page-modal-title">📊 Statistics</h2>
                        <div className="set-page-modal-progress-wrap">
                            <div className="set-page-modal-progress-track">
                                <div className="set-page-modal-progress-fill" style={{ width: `${percentKnowWell}%` }} />
                            </div>
                            <p className="set-page-modal-progress-label">{percentKnowWell}% Know Well</p>
                        </div>
                        <div className="set-page-stats-grid">
                            <div className="set-page-stat-item"><span className="set-page-stat-label">Cards in set</span><span className="set-page-stat-value">{setData.flashcards?.length ?? 0}</span></div>
                            <div className="set-page-stat-item"><span className="set-page-stat-label">Time studied</span><span className="set-page-stat-value">{formatSeconds(stats?.totalStudySeconds)}</span></div>
                            <div className="set-page-stat-item"><span className="set-page-stat-label">Date created</span><span className="set-page-stat-value">{formatDate(setData.createdAt)}</span></div>
                            <div className="set-page-stat-item"><span className="set-page-stat-label">Last updated</span><span className="set-page-stat-value">{formatDate(setData.updatedAt)}</span></div>
                        </div>
                    </div>
                </div>
            )}

            {/* Review modal */}
            {showReview && (
                <div className="set-page-modal-overlay" onClick={() => setShowReview(false)}>
                    <div className="set-page-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="set-page-modal-close" onClick={() => setShowReview(false)}>✕</button>
                        <h2 className="set-page-modal-title">⭐ Rate this Set</h2>

                        <div className="review-section">
                            <p className="review-section-label">Your Rating</p>
                            <StarPicker value={reviewStars} onChange={setReviewStars} />
                        </div>

                        <div className="review-section">
                            <p className="review-section-label">Tags <span className="review-tag-hint">(pick up to 3)</span></p>
                            <div className="review-tag-grid">
                                {TAGS.map(tag => {
                                    const selected = reviewTags.includes(tag.value);
                                    const disabled = !selected && reviewTags.length >= 3;
                                    return (
                                        <button
                                            key={tag.value}
                                            type="button"
                                            disabled={disabled}
                                            className={`review-tag-btn ${tag.positive ? 'review-tag-btn--pos' : 'review-tag-btn--neg'} ${selected ? 'review-tag-btn--selected' : ''} ${disabled ? 'review-tag-btn--disabled' : ''}`}
                                            onClick={() => toggleTag(tag.value)}
                                        >
                                            {tag.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {reviewError && <p className="review-error">{reviewError}</p>}

                        <div className="review-actions">
                            {myReview && <button className="set-page-cancel-btn review-delete-btn" onClick={handleDeleteReview}>Delete Review</button>}
                            <button className="set-page-cancel-btn" onClick={() => setShowReview(false)}>Cancel</button>
                            <button className="set-page-save-btn" onClick={handleSubmitReview} disabled={reviewSubmitting || reviewStars === 0}>
                                {reviewSubmitting ? 'Saving…' : myReview ? 'Update Review' : 'Submit Review'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showConceptMapModal && (
                <ConceptMapModal 
                    sourceSetId={id} 
                    defaultCards={setData.flashcards} 
                    onClose={() => setShowConceptMapModal(false)}
                    aiDisabled={currentUser?.aiDisabled}
                />
            )}

            {showReport && (
                <ReportModal
                    targetType="item"
                    targetId={setData.id}
                    onClose={() => setShowReport(false)}
                />
            )}
        </div>
    );
};

const generateFileContent = (cards, format) => {
    if (!cards) return "";
    if (format === 'csv') {
        const header = "Term,Definition\n";
        const rows = cards.map(c => `"${(c.term||"").replace(/"/g,'""')}","${(c.definition||"").replace(/"/g,'""')}"`).join("\n");
        return header + rows;
    }
    if (format === 'txt') return cards.map(c => `${c.term || "Untitled"} : ${c.definition || "No definition"}`).join("\n");
    return "";
};

export default FlashcardSetPage;