import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { searchLibrary, openPDF } from "../api.js";
import BackButton from "../components/BackButton.jsx";

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
        ? results.folders.length + results.flashcardSets.length + results.pdfs.length + (results.users?.length ?? 0)
        : 0;

    return (
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 16px" }}>
            <BackButton />

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
                                    <p className="recent-title">{item.title}</p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                                        {item.averageRating != null ? (
                                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f59e0b' }}>
                                                ★ {item.averageRating.toFixed(1)}
                                            </span>
                                        ) : (
                                            <span style={{ fontSize: '0.8rem', color: '#aaa' }}>★ No reviews</span>
                                        )}
                                        {(item.topTags ?? []).map(tag => {
                                            const isPos = ['WELL_ORGANIZED','COVERS_EXAM_CONTENT','EASY_TO_STUDY','COVERS_LECTURE_CONTENT'].includes(tag);
                                            return (
                                                <span key={tag} style={{
                                                    fontSize: '0.72rem', fontWeight: 600, padding: '2px 8px',
                                                    borderRadius: '99px', border: '1px solid',
                                                    background: isPos ? '#dcfce7' : '#fde8e8',
                                                    borderColor: isPos ? '#86efac' : '#f5b8b8',
                                                    color: isPos ? '#15803d' : '#b91c1c',
                                                }}>
                                                    {tag.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}
                                                </span>
                                            );
                                        })}
                                    </div>
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

                    {results.users?.length > 0 && (
                        <section style={{ marginBottom: 32 }}>
                            <h3 style={{ marginBottom: 12 }}>Users</h3>
                            {results.users.map(user => (
                                <div key={user.id} className="recent-item"
                                     onClick={() => navigate(`/users/${user.username}`)}
                                     style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
                                    {user.profilePictureUrl
                                        ? <img src={user.profilePictureUrl} alt="" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }} />
                                        : <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600 }}>
                                            {user.username.charAt(0).toUpperCase()}
                                          </div>
                                    }
                                    <p className="recent-title">👤 {user.username}</p>
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