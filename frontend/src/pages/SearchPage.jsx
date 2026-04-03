import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { searchLibrary, openPDF } from "../api.js";

const SearchPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const q = searchParams.get("q") ?? "";

    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!q) return;
        setLoading(true);
        setError("");
        searchLibrary(q)
            .then(setResults)
            .catch(err => setError(err.message ?? "Search failed"))
            .finally(() => setLoading(false));
    }, [q]);

    const total = results
        ? results.folders.length + results.flashcardSets.length + results.pdfs.length
        : 0;

    return (
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 16px" }}>
            <button onClick={() => navigate(-1)} style={{ marginBottom: 24, background: "none", border: "none", cursor: "pointer", fontSize: 14 }}>
                ← Back
            </button>

            <h2 style={{ marginBottom: 4 }}>Search results for "{q}"</h2>
            {!loading && <p style={{ color: "#888", marginBottom: 24, fontSize: 14 }}>{total} result{total !== 1 ? "s" : ""}</p>}

            {loading && <p>Searching…</p>}
            {error && <p style={{ color: "red" }}>{error}</p>}

            {results && (
                <>
                    {results.folders.length > 0 && (
                        <section style={{ marginBottom: 32 }}>
                            <h3 style={{ marginBottom: 12 }}>Folders</h3>
                            {results.folders.map(f => (
                                <div key={f.id} className="recent-item" onClick={() => navigate("/folders")}
                                     style={{ cursor: "pointer" }}>
                                    <p className="recent-title">📁 {f.name}</p>
                                </div>
                            ))}
                        </section>
                    )}

                    {results.flashcardSets.length > 0 && (
                        <section style={{ marginBottom: 32 }}>
                            <h3 style={{ marginBottom: 12 }}>Flashcard Sets</h3>
                            {results.flashcardSets.map(item => (
                                <div key={item.id} className="recent-item"
                                     onClick={() => navigate(`/sets/${item.id}`)}
                                     style={{ cursor: "pointer" }}>
                                    <p className="recent-title">🃏 {item.title}</p>
                                </div>
                            ))}
                        </section>
                    )}

                    {results.pdfs.length > 0 && (
                        <section style={{ marginBottom: 32 }}>
                            <h3 style={{ marginBottom: 12 }}>PDFs</h3>
                            {results.pdfs.map(item => (
                                <div key={item.id} className="recent-item"
                                     onClick={() => openPDF(item.id)}
                                     style={{ cursor: "pointer" }}>
                                    <p className="recent-title">📄 {item.title}</p>
                                </div>
                            ))}
                        </section>
                    )}

                    {total === 0 && (
                        <p style={{ color: "#888" }}>No results found for "{q}".</p>
                    )}
                </>
            )}
        </div>
    );
};

export default SearchPage;