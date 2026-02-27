import { useEffect, useMemo, useRef, useState } from "react";
import { createFolder, getFolders, renameFolder, deleteFolder, setFolderStarred } from "./api";
import "./app.css";

export default function App() {
    const [folders, setFolders] = useState([]);
    const [selectedFolderId, setSelectedFolderId] = useState(null);

    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Sorting
    const [sortBy, setSortBy] = useState("alpha-asc");
    const [showSortMenu, setShowSortMenu] = useState(false);
    const sortMenuRef = useRef(null);
    const SORT_LABELS = {
        "alpha-asc": "Alphabetical (A → Z)",
        "alpha-desc": "Alphabetical (Z → A)",
        "created-desc": "Creation date (Newest)",
        "created-asc": "Creation date (Oldest)",
        "accessed-desc": "Last accessed",
    };

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [modalName, setModalName] = useState("");
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Overflow menu state: holds the id of the card whose menu is open
    const [openMenuId, setOpenMenuId] = useState(null);

    // Rename modal state
    const [renameId, setRenameId] = useState(null);
    const [renameName, setRenameName] = useState("");

    // Privacy modal state
    const [showPrivacyModal, setShowPrivacyModal] = useState(false);

    function openPrivacy() {
        setShowPrivacyModal(true);
    }

    function closePrivacy() {
        setShowPrivacyModal(false);
    }

    const menuRef = useRef(null);

    async function loadFolders() {
        setError("");
        setLoading(true);
        try {
            const data = await getFolders();
            const list = Array.isArray(data) ? data : [];
            setFolders(list);
            if (list.length && selectedFolderId == null) setSelectedFolderId(list[0].id);
        } catch (err) {
            setError(err.message ?? "Something went wrong");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadFolders();
    }, []);

    // Close overflow menu when clicking outside
    useEffect(() => {
        if (!openMenuId) return;
        function onPointerDown(e) {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setOpenMenuId(null);
            }
        }
        window.addEventListener("pointerdown", onPointerDown);
        return () => window.removeEventListener("pointerdown", onPointerDown);
    }, [openMenuId]);

    // Header disappearing when scrolling
    useEffect(() => {
        const libraryEl = document.querySelector('.library');
        const header = document.querySelector('.libraryHeader');
        if (!libraryEl || !header) return;

        let lastScrollTop = 0;

        function handleScroll() {
            const current = libraryEl.scrollTop;

            // Always show header at very top
            if (current <= 10) {
                header.classList.remove('scrolled');
                lastScrollTop = current;
                return;
            }

            // If scrolling down → hide
            if (current > lastScrollTop) {
                header.classList.add('scrolled');
            }
            // If scrolling up → show immediately
            else {
                header.classList.remove('scrolled');
            }

            lastScrollTop = current;
        }

        libraryEl.addEventListener('scroll', handleScroll);
        return () => libraryEl.removeEventListener('scroll', handleScroll);
    }, []);

    // Sorting
    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        const list = folders.filter((f) => f.name.toLowerCase().includes(q));

        function safeTime(x) {
            const t = x ? new Date(x).getTime() : 0;
            return Number.isFinite(t) ? t : 0;
        }

        function compareBySort(a, b) {
            switch (sortBy) {
                case "alpha-desc":
                    return (b.name ?? "").localeCompare(a.name ?? "");

                case "created-asc":
                    return safeTime(a.createdAt) - safeTime(b.createdAt);

                case "created-desc":
                    return safeTime(b.createdAt) - safeTime(a.createdAt);

                // last accessed (you only asked one way; I’m assuming "most recent first")
                case "accessed-desc":
                    // If lastAccessed is null, treat as very old so it sinks.
                    return safeTime(b.lastAccessed) - safeTime(a.lastAccessed);

                case "alpha-asc":
                default:
                    return (a.name ?? "").localeCompare(b.name ?? "");
            }
        }

        return [...list].sort((a, b) => {
            // ⭐ Always keep starred at the top
            if (a.starred !== b.starred) return a.starred ? -1 : 1;

            // Then sort within the starred group / unstarred group
            const primary = compareBySort(a, b);
            if (primary !== 0) return primary;

            // Stable-ish tie breakers so order doesn’t jitter
            const byName = (a.name ?? "").localeCompare(b.name ?? "");
            if (byName !== 0) return byName;

            return (a.id ?? 0) - (b.id ?? 0);
        });
    }, [folders, query, sortBy]);

    useEffect(() => {
        if (!showSortMenu) return;

        function handlePointerDown(e) {
            if (sortMenuRef.current && !sortMenuRef.current.contains(e.target)) {
                setShowSortMenu(false);
            }
        }

        window.addEventListener("pointerdown", handlePointerDown);
        return () => window.removeEventListener("pointerdown", handlePointerDown);
    }, [showSortMenu]);

    const selected = useMemo(
        () => folders.find((f) => f.id === selectedFolderId) ?? null,
        [folders, selectedFolderId]
    );

    // ── Create modal ──────────────────────────────────────────────────────────
    function openCreateFolderModal() {
        setError("");
        setModalName("");
        setShowModal(true);
    }

    function closeModal() {
        setShowModal(false);
        setModalName("");
    }

    async function onCreateFromModal(e) {
        e.preventDefault();
        const name = modalName.trim();
        if (!name || submitting) return;

        setError("");
        setSubmitting(true);
        try {
            const created = await createFolder({ name, libraryId: 1 });
            setFolders((prev) => [created, ...prev]);
            setSelectedFolderId(created.id);
            closeModal();
        } catch (err) {
            setError(err.message ?? "Failed to create folder");
        } finally {
            setSubmitting(false);
        }
    }

    // Close modals with Escape
    useEffect(() => {
        function onKeyDown(ev) {
            if (ev.key === "Escape") {
                if (showModal) closeModal();
                if (renameId !== null) closeRenameModal();
                if (confirmDeleteId !== null) setConfirmDeleteId(null);
                if (showPrivacyModal) closePrivacy();
                if (showSortMenu) setShowSortMenu(false);
                setOpenMenuId(null);
            }
        }
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [showModal, renameId, confirmDeleteId, showPrivacyModal, showSortMenu]);

    // ── Star toggle ───────────────────────────────────────────────────────────
    async function onToggleStar(folderId) {
        // optimistic update
        const prev = folders;
        setFolders((curr) =>
            curr.map((f) => (f.id === folderId ? { ...f, starred: !f.starred } : f))
        );

        try {
            const folder = folders.find((f) => f.id === folderId);
            const updated = await setFolderStarred(folderId, !folder.starred);

            // reconcile with server response
            setFolders((curr) =>
                curr.map((f) => (f.id === folderId ? updated : f))
            );
        } catch (e) {
            setError(e.message ?? "Failed to update star");
            setFolders(prev); // rollback
        }
    }

    // ── Delete ────────────────────────────────────────────────────────────────
    function openDeleteConfirm(id) {
        setOpenMenuId(null);
        setConfirmDeleteId(id);
    }

    async function confirmDelete() {
        const id = confirmDeleteId;
        setConfirmDeleteId(null); // close modal immediately

        try {
            await deleteFolder(id);
            setFolders((prev) => prev.filter((f) => f.id !== id));
            if (selectedFolderId === id) setSelectedFolderId(null);
        } catch (err) {
            setError(err.message ?? "Failed to delete folder");
        }
    }

    // ── Rename modal ──────────────────────────────────────────────────────────
    function openRenameModal(folder) {
        setOpenMenuId(null);
        setRenameId(folder.id);
        setRenameName(folder.name ?? "");
    }

    function closeRenameModal() {
        setRenameId(null);
        setRenameName("");
    }

    async function onRenameSubmit(e) {
        e.preventDefault();
        const name = renameName.trim();
        if (!name) return;

        setError("");
        try {
            const updated = await renameFolder(renameId, name);

            //setFolders((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
            setFolders((prev) =>
                prev.map((f) => (f.id === renameId ? { ...f, name } : f))
            );
            closeRenameModal();
        } catch (err) {
            setError(err.message ?? "Failed to rename folder");
        }
    }

    return (
        <div className="appShell">
            {/* Left rail */}
            <aside className="rail">
                <div className="brand">
                    <div className="brandMark">📚</div>
                    <div>
                        <div className="brandTitle">Atama</div>
                        <div className="brandSub">Library</div>
                    </div>
                </div>

                <button
                    className="btn settings"
                    type="button"
                    onClick={openPrivacy}
                    aria-haspopup="dialog"
                    aria-expanded={showPrivacyModal}
                >
                    Privacy Settings
                </button>

                <button className="btn primary" onClick={openCreateFolderModal} type="button">
                    Create Folder
                </button>

                <div className="panel">
                    <div className="panelTitle">Find</div>
                    <label htmlFor="folder-search" className="srOnly">Search folders</label>
                    <input
                        id="folder-search"
                        className="input"
                        placeholder="Search folders…"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>

                {error ? <div className="error">{error}</div> : null}
            </aside>

            {/* Right: library */}
            <main className="library">
                <header className="libraryHeader">
                    <div>
                        <div className="libraryTitle">Folders</div>
                        <div className="librarySub">
                            {loading ? "Loading…" : `${filtered.length} folder${filtered.length === 1 ? "" : "s"}`}
                            {selected ? ` · Selected: ${selected.name}` : ""}
                        </div>
                    </div>

                    <div className="sortWrap" ref={sortMenuRef}>
                        <button
                            type="button"
                            className="iconBtn"
                            onClick={() => setShowSortMenu((p) => !p)}
                            aria-haspopup="true"
                            aria-expanded={showSortMenu}
                            title="Sort folders"
                        >
                            ⇅ Sort: {SORT_LABELS[sortBy]}
                        </button>

                        {showSortMenu && (
                            <div className="dropdownMenu" role="menu">
                                <button
                                    className="menuItem"
                                    onClick={() => { setSortBy("alpha-asc"); setShowSortMenu(false); }}
                                >
                                    Alphabetical (A → Z)
                                </button>

                                <button
                                    className="menuItem"
                                    onClick={() => { setSortBy("alpha-desc"); setShowSortMenu(false); }}
                                >
                                    Alphabetical (Z → A)
                                </button>

                                <button
                                    className="menuItem"
                                    onClick={() => { setSortBy("created-desc"); setShowSortMenu(false); }}
                                >
                                    Creation date (Newest)
                                </button>

                                <button
                                    className="menuItem"
                                    onClick={() => { setSortBy("created-asc"); setShowSortMenu(false); }}
                                >
                                    Creation date (Oldest)
                                </button>

                                <button
                                    className="menuItem"
                                    onClick={() => { setSortBy("accessed-desc"); setShowSortMenu(false); }}
                                >
                                    Last accessed
                                </button>
                            </div>
                        )}
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
                                <div
                                    key={f.id}
                                    className={`folderCard ${f.id === selectedFolderId ? "active" : ""}`}
                                    onClick={() => setSelectedFolderId(f.id)}
                                    title={`Folder #${f.id}`}
                                >
                                    <div className="folderName">{f.name}</div>
                                    <div className="folderMeta">
                                        <span>#{f.id}</span>

                                        <div className="folderActions">
                                            {/* FIX 2: actionable star toggle */}
                                            <button
                                                type="button"
                                                className={`iconBtn starBtn ${f.starred ? "starred" : ""}`}
                                                onClick={(e) => {
                                                    e.stopPropagation(); // don’t select folder if you click star
                                                    onToggleStar(f.id);
                                                }}
                                                title={f.starred ? "Unstar" : "Star"}
                                                aria-label={f.starred ? "Unstar folder" : "Star folder"}
                                            >
                                                {f.starred ? "★" : "☆"}
                                            </button>

                                            {/* FIX 1: ⋯ overflow menu */}
                                            <div className="menuWrap" ref={openMenuId === f.id ? menuRef : null}>
                                                <button
                                                    type="button"
                                                    className="iconBtn menuTrigger"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setOpenMenuId(openMenuId === f.id ? null : f.id);
                                                    }}
                                                    aria-label="Folder options"
                                                    aria-haspopup="true"
                                                    aria-expanded={openMenuId === f.id}
                                                >
                                                    ⋯
                                                </button>

                                                {openMenuId === f.id && (
                                                    <div className="dropdownMenu" role="menu">
                                                        <button
                                                            role="menuitem"
                                                            className="menuItem"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                openRenameModal(f);
                                                            }}
                                                        >
                                                            ✏️ Rename
                                                        </button>
                                                        <button
                                                            role="menuitem"
                                                            className="menuItem danger"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                openDeleteConfirm(f.id);
                                                            }}
                                                        >
                                                            🗑️ Delete
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </main>

            {/* Create folder modal */}
            {showModal && (
                <div className="modalOverlay" onClick={closeModal}>
                    <div
                        className="modal"
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="createModalTitle"
                    >
                        <div className="modalTitle" id="createModalTitle">Create folder</div>

                        <form onSubmit={onCreateFromModal} className="modalForm">
                            <input
                                className="modalInput"
                                placeholder="Folder name…"
                                value={modalName}
                                onChange={(e) => setModalName(e.target.value)}
                                autoFocus
                            />

                            {/* FIX 4: cancel gets a visible border, not invisible ghost */}
                            <div className="modalActions">
                                <button className="btn cancelBtn" type="button" onClick={closeModal}>
                                    Cancel
                                </button>
                                <button className="btn primary" type="submit" disabled={!modalName.trim() || submitting}>
                                    {submitting ? "Creating…" : "Create"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}


            {/* Rename folder modal */}
            {renameId !== null && (
                <div className="modalOverlay" onClick={closeRenameModal}>
                    <div
                        className="modal"
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="renameModalTitle"
                    >
                        <div className="modalTitle" id="renameModalTitle">Rename folder</div>

                        <form onSubmit={onRenameSubmit} className="modalForm">
                            <input
                                className="modalInput"
                                placeholder="New name…"
                                value={renameName}
                                onChange={(e) => setRenameName(e.target.value)}
                                autoFocus
                                onFocus={(e) => e.target.select()}
                            />

                            <div className="modalActions">
                                <button className="btn cancelBtn" type="button" onClick={closeRenameModal}>
                                    Cancel
                                </button>
                                <button className="btn primary" type="submit" disabled={!renameName.trim()}>
                                    Rename
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {confirmDeleteId !== null && (
                <div className="modalOverlay" onClick={() => setConfirmDeleteId(null)}>
                    <div
                        className="modal"
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="deleteModalTitle"
                    >
                        <div className="modalTitle" id="deleteModalTitle">Delete folder?</div>
                        <p className="modalBody">
                            Are you sure you want to delete this folder?
                            The items inside will <strong>NOT</strong> be deleted.
                        </p>
                        <div className="modalActions">
                            <button className="btn cancelBtn" type="button" onClick={() => setConfirmDeleteId(null)}>
                                No, don't delete
                            </button>
                            <button className="btn danger" type="button" onClick={confirmDelete}>
                                Yes, delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showPrivacyModal && (
                <div className="modalOverlay" onClick={closePrivacy}>
                    <div
                        className="modal"
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="privacyModalTitle"
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: 12,
                            }}
                        >
                            <div className="modalTitle" id="privacyModalTitle">
                                Privacy Settings
                            </div>

                            <button
                                type="button"
                                className="iconBtn"
                                onClick={closePrivacy}
                                aria-label="Close privacy settings"
                                title="Close"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="modalBody" style={{ marginTop: 10 }}>
                            {/* TODO: privacy settings content goes here */}
                        </div>

                        <div className="modalActions" style={{ marginTop: 14 }}>
                            <button type="button" className="btn cancelBtn" onClick={closePrivacy}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}