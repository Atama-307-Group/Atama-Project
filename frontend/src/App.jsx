import { useEffect, useMemo, useState } from "react";
import { createFolder, getFolders } from "./api";
import "./app.css";

export default function App() {
    const [folders, setFolders] = useState([]);
    const [selectedFolderId, setSelectedFolderId] = useState(null);

    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // ✅ NEW: modal state
    const [showModal, setShowModal] = useState(false);
    const [modalName, setModalName] = useState("");

    async function loadFolders() {
        setError("");
        setLoading(true);
        try {
            const data = await getFolders();
            const list = Array.isArray(data) ? data : [];
            setFolders(list);
            if (list.length && selectedFolderId == null) setSelectedFolderId(list[0].id);
        } catch (e) {
            setError(e.message ?? "Something went wrong");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadFolders();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return folders;
        return folders.filter((f) => (f.name ?? "").toLowerCase().includes(q));
    }, [folders, query]);

    const selected = useMemo(
        () => folders.find((f) => f.id === selectedFolderId) ?? null,
        [folders, selectedFolderId]
    );

    // ✅ NEW: open/close modal helpers
    function openCreateFolderModal() {
        setError("");
        setModalName("");
        setShowModal(true);
    }

    function closeModal() {
        setShowModal(false);
        setModalName("");
    }

    // ✅ NEW: create from modal
    async function onCreateFromModal(e) {
        e.preventDefault();
        const name = modalName.trim();
        if (!name) return;

        setError("");
        try {
            const created = await createFolder({ name, libraryId: 1 });
            setFolders((prev) => [created, ...prev]);
            setSelectedFolderId(created.id);
            closeModal();
        } catch (e) {
            setError(e.message ?? "Failed to create folder");
        }
    }

    // ✅ NEW: close with Escape
    useEffect(() => {
        if (!showModal) return;

        function onKeyDown(ev) {
            if (ev.key === "Escape") closeModal();
        }

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showModal]);

    return (
        <div className="appShell">
            {/* Left rail: controls only (not the folders list) */}
            <aside className="rail">
                <div className="brand">
                    <div className="brandMark">📚</div>
                    <div>
                        <div className="brandTitle">Atama</div>
                        <div className="brandSub">Library</div>
                    </div>
                </div>


                <button className="btn primary" onClick={openCreateFolderModal} type="button">
                    Create Folder
                </button>

                <div className="panel">
                    <div className="panelTitle">Find</div>
                    <input
                        className="input"
                        placeholder="Search folders…"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>


                {error ? <div className="error">{error}</div> : null}
            </aside>

            {/* Right: the Library takes up the majority */}
            <main className="library">
                <header className="libraryHeader">
                    <div>
                        <div className="libraryTitle">Folders</div>
                        <div className="librarySub">
                            {loading ? "Loading…" : `${filtered.length} folder${filtered.length === 1 ? "" : "s"}`}
                            {selected ? ` · Selected: ${selected.name}` : ""}
                        </div>
                    </div>
                </header>

                <section className="libraryBody">
                    {loading ? (
                        <div className="emptyState">Gathering folders…</div>
                    ) : filtered.length === 0 ? (
                        <div className="emptyState">No folders found.</div>
                    ) : (
                        <div className="folderGrid">
                            {filtered.map((f) => (
                                <button
                                    key={f.id}
                                    type="button"
                                    className={`folderCard ${f.id === selectedFolderId ? "active" : ""}`}
                                    onClick={() => setSelectedFolderId(f.id)}
                                    title={`Folder #${f.id}`}
                                >
                                    <div className="folderName">{f.name}</div>
                                    <div className="folderMeta">
                                        <span>#{f.id}</span>
                                        {f.starred ? (
                                            <span className="star">★</span>
                                        ) : (
                                            <span className="star mutedStar">☆</span>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </section>
            </main>

            {/* ✅ MODAL (injected) */}
            {showModal && (
                <div className="modalOverlay" onClick={closeModal}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modalTitle">Create folder</div>

                        <form onSubmit={onCreateFromModal} className="modalForm">
                            <input
                                className="modalInput"
                                placeholder="Folder name…"
                                value={modalName}
                                onChange={(e) => setModalName(e.target.value)}
                                autoFocus
                            />

                            <div className="modalActions">
                                <button className="btn ghost" type="button" onClick={closeModal}>
                                    Cancel
                                </button>
                                <button className="btn primary" type="submit" disabled={!modalName.trim()}>
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}