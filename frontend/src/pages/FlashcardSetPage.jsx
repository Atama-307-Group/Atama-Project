
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getFlashcardSetById } from "../api.js";
import { updateFlashcardSetMeta, updateFlashcard } from '../api.js';
import FlashcardCard from "../components/FlashcardCard.jsx";
import FlashcardInput from "../components/FlashcardInput.jsx";
import "./FlashcardSetPage.css";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const FlashcardSetPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [setData, setSetData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // editingId: the card id (or index) currently being edited
    const [editingId, setEditingId] = useState(null);
    // editDraft: the working copy of the card being edited
    const [editDraft, setEditDraft] = useState(null);

    const [editingMeta, setEditingMeta] = useState(false);
    const [metaDraft, setMetaDraft] = useState({ title: '', description: '' });


    useEffect(() => {
        if (!UUID_REGEX.test(id)) {
            setError("Invalid flashcard set.");
            setLoading(false);
            return;
        }
        getFlashcardSetById(id)
            .then(setSetData)
            .catch((e) => setError(e.message ?? "Failed to load flashcard set."))
            .finally(() => setLoading(false));
    }, [id]);

    const startEditing = (card, index) => {
        setEditingId(card.id ?? index);
        setEditDraft({ ...card });
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditDraft(null);
    };

    const saveCard = async (index) => {
        const updated = await updateFlashcard(id, editDraft.id, editDraft);
        setSetData((prev) => ({
            ...prev,
            flashcards: prev.flashcards.map((c, i) => i === index ? updated : c),
        }));
        setEditingId(null);
        setEditDraft(null);
    };
    /*const saveCard = async (index) => {

        // Optimistically update local state
        setSetData((prev) => ({
            ...prev,
            flashcards: prev.flashcards.map((c, i) => i === index ? editDraft : c),
        }));
        setEditingId(null);
        setEditDraft(null);
    };*/

    const startEditingMeta = () => {
        setMetaDraft({ title: setData.title, description: setData.description ?? '', university: setData.university ?? '',
            course: setData.course ?? ''});
        setEditingMeta(true);
    };

    const cancelEditingMeta = () => {
        setEditingMeta(false);
    };

    const saveMeta = async () => {
        const updated = await updateFlashcardSetMeta(id, metaDraft);
        setSetData((prev) => ({ ...prev, title: updated.title, description: updated.description, university: updated.university, course: updated.course }));
        setEditingMeta(false);
    };
    /*const saveMeta = async () => {
        setSetData((prev) => ({ ...prev, ...metaDraft }));
        setEditingMeta(false);
    };*/

    if (loading) return <div className="set-page-loading">Loading...</div>;
    if (error)   return <div className="set-page-error">{error}</div>;

    return (
        <div className="set-page">
            <button className="set-page-back" type="button" onClick={() => navigate("/")}>
                ← Back
            </button>

            {editingMeta ? (
                <div className="set-page-meta-edit">
                    <input
                        className="set-page-meta-title-input"
                        value={metaDraft.title}
                        onChange={(e) => setMetaDraft((d) => ({ ...d, title: e.target.value }))}
                        placeholder="Title"
                    />
                    <textarea
                        className="set-page-meta-description-input"
                        value={metaDraft.description}
                        onChange={(e) => setMetaDraft((d) => ({ ...d, description: e.target.value }))}
                        placeholder="Description (optional)"
                        rows={2}
                    />
                    <input
                        className="set-page-meta-description-input"
                        value={metaDraft.university}
                        onChange={(e) => setMetaDraft((d) => ({ ...d, university: e.target.value }))}
                        placeholder="University (optional)"
                    />
                    <input
                        className="set-page-meta-description-input"
                        value={metaDraft.course}
                        onChange={(e) => setMetaDraft((d) => ({ ...d, course: e.target.value }))}
                        placeholder="Course (optional)"
                    />

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
                    <button className="set-page-edit-btn" onClick={startEditingMeta}>Edit title & description</button>
                </div>
            )}

            <h2>Cards ({setData.flashcards?.length ?? 0})</h2>

            {setData.flashcards?.length ? (
                <div className="set-page-cards">
                    {setData.flashcards.map((card, index) => {
                        const cardKey = card.id ?? index;
                        const isEditing = editingId === cardKey;

                        return isEditing ? (
                            <div key={cardKey} className="set-page-editing-card">
                                <FlashcardInput
                                    index={index}
                                    card={editDraft}
                                    onChange={(i, updated) => setEditDraft(updated)}
                                    onRemove={() => {}}
                                    canRemove={false}
                                />
                                <div className="set-page-edit-actions">
                                    <button className="set-page-cancel-btn" onClick={cancelEditing}>
                                        Cancel
                                    </button>
                                    <button className="set-page-save-btn" onClick={() => saveCard(index)}>
                                        Save
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div key={cardKey} className="set-page-card-wrap">
                                <FlashcardCard index={index} card={card} />
                                <button
                                    className="set-page-edit-btn"
                                    onClick={() => startEditing(card, index)}
                                >
                                    Edit
                                </button>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <p>No cards in this set.</p>
            )}
        </div>
    );
};

export default FlashcardSetPage;