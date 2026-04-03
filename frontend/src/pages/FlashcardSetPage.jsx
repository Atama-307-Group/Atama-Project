import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    generateSharedLink,
    getFlashcardSetById,
    updateFlashcardSetMeta,
    updateFlashcard,
    getSetProgress,
    getSetStats,
    saveSet,
    unsaveSet,
    updateSetPrivacy,
} from "../api.js";
import FlashcardCard from "../components/FlashcardCard.jsx";
import FlashcardInput from "../components/FlashcardInput.jsx";
import "./FlashcardSetPage.css";

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

const FlashcardSetPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [setData, setSetData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [editingId, setEditingId] = useState(null);
    const [editDraft, setEditDraft] = useState(null);
    const [editingMeta, setEditingMeta] = useState(false);
    const [metaDraft, setMetaDraft] = useState({ title: '', description: '', university: '', course: '' });
    const [shareStatus, setShareStatus] = useState(null);
    const [shareUrl, setShareUrl] = useState('');
    const [downloadStatus, setDownloadStatus] = useState(null);
    const [showDownloadOptions, setShowDownloadOptions] = useState(false);

    // Progress
    const [progressMap, setProgressMap] = useState({}); // flashcardId -> knowledgeLevel string
    const [stats, setStats] = useState(null);
    const [showStats, setShowStats] = useState(false);

    useEffect(() => {
        if (!UUID_REGEX.test(id)) {
            setError("Invalid flashcard set.");
            setLoading(false);
            return;
        }
        Promise.all([
            getFlashcardSetById(id),
            getSetProgress(id).catch(() => []),
            getSetStats(id).catch(() => null),
        ]).then(([setResult, progressResult, statsResult]) => {
            setSetData(setResult);
            const map = {};
            (progressResult || []).forEach(p => {
                // backend returns flashcard as object or just id depending on serialization
                const cardId = p.flashcard?.id ?? p.flashcardId;
                if (cardId) map[cardId] = p.knowledgeLevel;
            });
            setProgressMap(map);
            setStats(statsResult);
        }).catch((e) => setError(e.message ?? "Failed to load flashcard set."))
          .finally(() => setLoading(false));
    }, [id]);

    const startEditing = (card, index) => { setEditingId(card.id ?? index); setEditDraft({ ...card }); };
    const cancelEditing = () => { setEditingId(null); setEditDraft(null); };

    const saveCard = async (index) => {
        const updated = await updateFlashcard(id, editDraft.id, editDraft);
        setSetData((prev) => ({
            ...prev,
            flashcards: prev.flashcards.map((c, i) => i === index ? updated : c),
        }));
        setEditingId(null);
        setEditDraft(null);
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
            if (!content) throw new Error("No content generated");
            const filename = `${setData.title.replace(/\s+/g, '_')}.${format}`;
            const blob = new Blob([content], { type: 'text/plain' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
            setDownloadStatus('Flashcard set downloaded!');
            setTimeout(() => setDownloadStatus(null), 3000);
        } catch (err) {
            setDownloadStatus('Download failed. Please reload and try again.');
            setTimeout(() => setDownloadStatus(null), 3000);
        }
    };

    const handleShare = async () => {
        try {
            const { token } = await generateSharedLink(setData.id);
            const url = `${window.location.origin}/shared/${token}`;
            setShareUrl(url);
            await navigator.clipboard.writeText(url);
            setShareStatus('Link copied to clipboard!');
        } catch (e) {
            setShareStatus('Failed to generate/copy link.');
        } finally {
            setTimeout(() => setShareStatus(null), 3000);
        }
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
        navigate(destinations[mode], {
            state: { flashcards: setData.flashcards, setTitle: setData.title, setId: id }
        });
    };

    const percentKnowWell = stats?.percentKnowWell ?? 0;

    if (loading) return <div className="set-page-loading">Loading...</div>;
    if (error)   return <div className="set-page-error">{error}</div>;

    return (
        <div className="set-page">
            <button className="set-page-back" type="button" onClick={() => navigate("/")}>← Back</button>

            {/* Progress bar */}
            <div className="set-page-progress-bar-wrap">
                <div className="set-page-progress-bar-labels">
                    <span>Progress</span>
                    <span>{percentKnowWell}% Know Well</span>
                </div>
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

                    <div className="set-page-study-actions">
                        <button className="set-page-study-btn" onClick={() => handleStudyMode('learn')}>📖 Learn</button>
                        <button className="set-page-study-btn" onClick={() => handleStudyMode('match')}>🔀 Match</button>
                        <button className="set-page-study-btn" onClick={() => handleStudyMode('test')}>📝 Practice Test</button>
                        <button className="set-page-study-btn set-page-study-btn--stats" onClick={() => setShowStats(true)}>📊 View Statistics</button>
                    </div>

                    <div>
                        {setData.isOwner && (
                            <button className="set-page-edit-btn" onClick={startEditingMeta}>Edit title & description</button>
                        )}
                        {!setData.isOwner && (
                            <button className="set-page-edit-btn" onClick={handleSaveToggle}>
                                {setData.isSaved ? '✓ Saved' : '+ Save to Library'}
                            </button>
                        )}
                        <button className="set-page-edit-btn" onClick={handleShare}>Share Set</button>
                        <div className="download-container" style={{ position: 'relative', display: 'inline-block' }}>
                            <button className="set-page-edit-btn" onClick={() => setShowDownloadOptions(!showDownloadOptions)}>Download</button>
                            {showDownloadOptions && (
                                <div className="download-dropdown">
                                    <button onClick={() => { downloadSet('csv'); setShowDownloadOptions(false); }}>CSV file</button>
                                    <button onClick={() => { downloadSet('txt'); setShowDownloadOptions(false); }}>TXT file</button>
                                </div>
                            )}
                            {setData.isOwner && (
                                <button className="set-page-edit-btn" onClick={handlePrivacyToggle}>
                                    {setData.isPublic ? '🔒 Make Private' : '🔓 Make Public'}
                                </button>
                            )}
                        </div>
                    </div>

                    {shareStatus && (
                        <div className={`set-page-toast ${shareStatus.includes('failed') ? 'error' : 'success'}`}>
                            {shareStatus}
                            {shareUrl && !shareStatus.includes('failed') && (
                                <a href={shareUrl} target="_blank" rel="noreferrer" className="set-page-toast-link">{shareUrl}</a>
                            )}
                        </div>
                    )}
                    {downloadStatus && (
                        <div className={`set-page-toast ${downloadStatus.includes('failed') ? 'error' : 'success'}`}>{downloadStatus}</div>
                    )}
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
                                <FlashcardInput index={index} card={editDraft} onChange={(i, updated) => setEditDraft(updated)} onRemove={() => {}} canRemove={false} />
                                <div className="set-page-edit-actions">
                                    <button className="set-page-cancel-btn" onClick={cancelEditing}>Cancel</button>
                                    <button className="set-page-save-btn" onClick={() => saveCard(index)}>Save</button>
                                </div>
                            </div>
                        ) : (
                            <div
                                key={cardKey}
                                className="set-page-card-wrap"
                            >
                                <FlashcardCard index={index} card={card} knowledgeLevel={level} />
                                {setData.isOwner && (
                                    <button className="set-page-edit-btn" onClick={() => startEditing(card, index)}>Edit</button>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <p>No cards in this set.</p>
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
                            <div className="set-page-stat-item">
                                <span className="set-page-stat-label">Cards in set</span>
                                <span className="set-page-stat-value">{setData.flashcards?.length ?? 0}</span>
                            </div>
                            <div className="set-page-stat-item">
                                <span className="set-page-stat-label">Time studied</span>
                                <span className="set-page-stat-value">{formatSeconds(stats?.totalStudySeconds)}</span>
                            </div>
                            <div className="set-page-stat-item">
                                <span className="set-page-stat-label">Date created</span>
                                <span className="set-page-stat-value">{formatDate(setData.createdAt)}</span>
                            </div>
                            <div className="set-page-stat-item">
                                <span className="set-page-stat-label">Last updated</span>
                                <span className="set-page-stat-value">{formatDate(setData.updatedAt)}</span>
                            </div>
                        </div>
                    </div>
                </div>
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
    if (format === 'txt') {
        return cards.map(c => `${c.term || "Untitled"} : ${c.definition || "No definition"}`).join("\n");
    }
    return "";
};

export default FlashcardSetPage;