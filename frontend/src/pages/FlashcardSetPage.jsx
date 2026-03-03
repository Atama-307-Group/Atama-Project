import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getFlashcardSetById } from "../api.js";
import "./FlashcardSetPage.css";
import FlashcardCard from '../components/FlashcardCard.jsx';

/*function renderCard(card, index) {
    switch (card.type) {
        case "NORMAL":
            return (
                <li key={card.id ?? index}>
                    <strong>Normal:</strong> {card.term} → {card.definition}
                </li>
            );
        case "FILL_BLANK":
            return (
                <li key={card.id ?? index}>
                    <strong>Fill Blank:</strong> {card.textWithBlanks}
                </li>
            );
        case "DRAG_DROP":
            return (
                <li key={card.id ?? index}>
                    <strong>Drag & Drop:</strong> {card.prompt}
                </li>
            );
        case "STEPS":
            return (
                <li key={card.id ?? index}>
                    <strong>Steps:</strong> {card.title}
                </li>
            );
        default:
            return (
                <li key={card.id ?? index}>
                    <strong>{card.type ?? "Unknown"}:</strong> Unsupported card shape
                </li>
            );
    }
}*/

const FlashcardSetPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const parsedId = useMemo(() => Number(id), [id]);

    const [setData, setSetData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!Number.isFinite(parsedId) || parsedId <= 0) {
            setError("Invalid flashcard set.");
            setLoading(false);
            return;
        }
        getFlashcardSetById(parsedId)
            .then(setSetData)
            .catch((e) => setError(e.message ?? "Failed to load flashcard set."))
            .finally(() => setLoading(false));
    }, [parsedId]);

    if (loading) return <div className="set-page-loading">Loading…</div>;
    if (error)   return <div className="set-page-error">{error}</div>;

    return (
        <div className="set-page">
            <button className="set-page-back" type="button" onClick={() => navigate("/")}>
                ← Back
            </button>

            <h1>{setData.title}</h1>

            {setData.description && (
                <p className="set-page-description">{setData.description}</p>
            )}

            <h2>Cards ({setData.flashcards?.length ?? 0})</h2>

            {setData.flashcards?.length ? (
                <div className="set-page-cards">
                    {setData.flashcards.map((card, index) => (
                        <FlashcardCard key={card.id ?? index} index={index} card={card} />
                    ))}
                </div>
            ) : (
                <p>No cards in this set.</p>
            )}
        </div>
    );
};

export default FlashcardSetPage;