import {useEffect, useMemo, useRef, useState} from "react";
import {
    createFolder, getFolders, renameFolder, deleteFolder, setFolderStarred, getFolderItems, setFolderPrivacy,
    getLibraryItems, moveItemToFolder, removeItemFromFolder, uploadPDF, recordAccess, openPDF, toggleItemStarred
} from "../api.js";
import {useNavigate} from "react-router-dom";
import "./FoldersPage.css";

const FoldersPage = () => {
    const navigate = useNavigate(); // TODO use
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

    // Folder privacy
    const [privacyId, setPrivacyId] = useState(null);
    const [nextIsPublic, setNextIsPublic] = useState(false);

    // Folder items
    const [items, setItems] = useState([]);
    const [itemsLoading, setItemsLoading] = useState(false);
    const [itemsError, setItemsError] = useState("");

    const menuRef = useRef(null);

    // Loose library items
    const [libItems, setLibItems] = useState([]);

    const [organizeMode, setOrganizeMode] = useState(false);
    const [selectedItemIds, setSelectedItemIds] = useState(new Set());

    const [openItemMenuId, setOpenItemMenuId] = useState(null);

    const fileInputRef = useRef(null); // PDF Uploads

    async function loadFolders() {
        setError("");
        setLoading(true);
        try {
            const data = await getFolders();
            const list = Array.isArray(data) ? data : [];
            setFolders(list);
            // if (list.length && selectedFolderId == null) setSelectedFolderId(list[0].id);
        } catch (err) {
            setError(err.message ?? "Something went wrong");
        } finally {
            setLoading(false);
        }
    }

    // Load the folders
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

    // Loading Folder items
    useEffect(() => {
        if (selectedFolderId == null) {
            setItems([]);
            setItemsError("");
            setItemsLoading(false);
            return;
        }

        let cancelled = false;

        async function loadItems() {
            setItemsError("");
            setItemsLoading(true);
            try {
                const data = await getFolderItems(selectedFolderId);
                if (!cancelled) setItems(Array.isArray(data.items) ? data.items : []);
                //if (!cancelled) setLibItems(Array.isArray(data) ? data : []);
            } catch (e) {
                if (!cancelled) setItemsError(e.message ?? "Failed to load folder contents");
            } finally {
                if (!cancelled) setItemsLoading(false);
            }
        }

        loadItems();
        return () => {
            cancelled = true;
        };
    }, [selectedFolderId]);

    // Loading library items
    useEffect(() => {
        async function loadLibItems() {
            try {
                const data = await getLibraryItems();
                setLibItems(Array.isArray(data) ? data : []);
            } catch (err) {
                setError(err.message ?? "Failed to load items");
            }
        }

        loadLibItems();
    }, []);

    const filteredFolderItems = useMemo(() => {
        function safeTime(x) {
            const t = x ? new Date(x).getTime() : 0;
            return Number.isFinite(t) ? t : 0;
        }

        // Sort items in Folders
        function compareBySort(a, b) {
            switch (sortBy) {
                case "alpha-desc":
                    return (b.title ?? "").localeCompare(a.title ?? "");
                case "created-asc":
                    return safeTime(a.createdAt) - safeTime(b.createdAt);
                case "created-desc":
                    return safeTime(b.createdAt) - safeTime(a.createdAt);
                case "accessed-desc":
                    return safeTime(b.lastAccessed) - safeTime(a.lastAccessed);
                case "alpha-asc":
                default:
                    return (a.title ?? "").localeCompare(b.title ?? "");
            }
        }

        return [...items].sort((a, b) => {
            if (a.starred !== b.starred) return a.starred ? -1 : 1;
            return compareBySort(a, b);
        });
    }, [items, sortBy]);

    // Sort all library items
    const filteredItems = useMemo(() => {
        const q = query.trim().toLowerCase();
        const list = libItems.filter(item =>
            item.title?.toLowerCase().includes(q) && !item.folderId
        );

        function safeTime(x) {
            const t = x ? new Date(x).getTime() : 0;
            return Number.isFinite(t) ? t : 0;
        }

        function compareBySort(a, b) {
            switch (sortBy) {
                case "alpha-desc":
                    return (b.title ?? "").localeCompare(a.title ?? "");
                case "created-asc":
                    return safeTime(a.createdAt) - safeTime(b.createdAt);
                case "created-desc":
                    return safeTime(b.createdAt) - safeTime(a.createdAt);
                case "accessed-desc":
                    return safeTime(b.lastAccessed) - safeTime(a.lastAccessed);
                case "alpha-asc":
                default:
                    return (a.title ?? "").localeCompare(b.title ?? "");
            }
        }

        return [...list].sort((a, b) => {
            if (a.starred !== b.starred) return a.starred ? -1 : 1;
            const primary = compareBySort(a, b);
            if (primary !== 0) return primary;
            return (a.title ?? "").localeCompare(b.title ?? "");
        });
    }, [libItems, query, sortBy]);

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

            // Then sort within the starred group / un-starred group
            const primary = compareBySort(a, b);
            if (primary !== 0) return primary;

            // Stable-ish tiebreakers so order doesn’t jitter
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
            const created = await createFolder({name});
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
                if (privacyId !== null) setPrivacyId(null);
                if (showSortMenu) setShowSortMenu(false);
                setOpenMenuId(null);
            }
        }

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [showModal, renameId, confirmDeleteId, privacyId, showSortMenu]);

    // ── Star toggle ───────────────────────────────────────────────────────────
    async function onToggleStar(folderId) {
        // optimistic update
        const prev = folders;
        setFolders((curr) =>
            curr.map((f) => (f.id === folderId ? {...f, starred: !f.starred} : f))
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

    async function onToggleItemStar(itemId) {
        const prev = libItems;
        setLibItems((curr) =>
            curr.map((i) => (i.id === itemId ? { ...i, starred: !i.starred } : i))
        );

        try {
            const updated = await toggleItemStarred(itemId);
            setLibItems((curr) =>
                curr.map((i) => (i.id === itemId ? { ...i, starred: updated.starred } : i))
            );
        } catch (e) {
            setError(e.message ?? "Failed to update star");
            setLibItems(prev);
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
                prev.map((f) => (f.id === renameId ? {...f, name} : f))
            );
            closeRenameModal();
        } catch (err) {
            setError(err.message ?? "Failed to rename folder");
        }
    }

    // ── Privacy modal ──────────────────────────────────────────────────────────
    function openPrivacyModal(folder) {
        setPrivacyId(folder.id);
        setNextIsPublic(!folder.isPublic);
        setOpenMenuId(null);
    }

    async function confirmPrivacyChange() {
        if (privacyId == null) return;
        const prevFolders = folders; // save for rollback
        const newValue = nextIsPublic;
        setPrivacyId(null);

        try {
            const updated = await setFolderPrivacy(privacyId, nextIsPublic);
            setFolders((prev) =>
                prev.map((f) => f.id === updated.id ? {...f, isPublic: updated.isPublic} : f)
            );
        } catch (e) {
            setError(e.message ?? "Failed to update privacy");
            setFolders(prevFolders); // rollback
        }
    }

    // Upload handler
    async function onUploadPDF(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const newItem = await uploadPDF(file);
            setLibItems(prev => [{ ...newItem, folderId: null }, ...prev]);
        } catch (err) {
            setError(err.message ?? "Failed to upload PDF");
        }
    }

    // ── Main ──────────────────────────────────────────────────────────

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

                <button className="btn primary" onClick={() => navigate('/create')} type="button">
                    New Flashcard Set
                </button>

                <button className="btn secondary" type="button" onClick={() => fileInputRef.current.click()}>
                    Upload PDF
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    style={{ display: "none" }}
                    onChange={onUploadPDF}
                />

                <button className="btn ghost"
                        onClick={() => setShowModal(true)}
                        disabled={selectedFolderId !== null}
                        type="button">
                    New Folder
                </button>

                <button
                    type="button"
                    className={`btn ${organizeMode ? "primary" : "organize"}`}
                    onClick={() => {
                        setOrganizeMode(p => !p);
                        setSelectedItemIds(new Set());
                    }}
                >
                    {organizeMode ? "Done" : "Organize"}
                </button>

                <div className="panel">
                    <div className="panelTitle">Search</div>
                    <label htmlFor="folder-search" className="srOnly">Search personal library</label>
                    <input
                        id="folder-search"
                        className="input"
                        placeholder="Search personal library…"
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
                        <div className="libraryTitle">Your Library</div>
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
                                    onClick={() => {
                                        setSortBy("alpha-asc");
                                        setShowSortMenu(false);
                                    }}
                                >
                                    Alphabetical (A → Z)
                                </button>

                                <button
                                    className="menuItem"
                                    onClick={() => {
                                        setSortBy("alpha-desc");
                                        setShowSortMenu(false);
                                    }}
                                >
                                    Alphabetical (Z → A)
                                </button>

                                <button
                                    className="menuItem"
                                    onClick={() => {
                                        setSortBy("created-desc");
                                        setShowSortMenu(false);
                                    }}
                                >
                                    Creation date (Newest)
                                </button>

                                <button
                                    className="menuItem"
                                    onClick={() => {
                                        setSortBy("created-asc");
                                        setShowSortMenu(false);
                                    }}
                                >
                                    Creation date (Oldest)
                                </button>

                                <button
                                    className="menuItem"
                                    onClick={() => {
                                        setSortBy("accessed-desc");
                                        setShowSortMenu(false);
                                    }}
                                >
                                    Last accessed
                                </button>
                            </div>
                        )}
                    </div>
                </header>

                <section className="libraryBody">
                    {selectedFolderId == null ? (
                        loading ? (
                            <div className="emptyState">Gathering your library …</div>
                        ) : filtered.length === 0 ? (
                            <div className="emptyState">No items found.</div>
                        ) : (
                            <div className="folderGrid">
                                {filtered.map((f) => (
                                    <div
                                        key={f.id}
                                        className={`folderCard ${organizeMode && selectedItemIds.size > 0 ? "folderDropTarget" : ""}`}
                                        onClick={async () => {
                                            if (organizeMode && selectedItemIds.size > 0) {
                                                await Promise.all(
                                                    [...selectedItemIds].map(id => moveItemToFolder(id, f.id))
                                                );
                                                setLibItems(prev => prev.filter(i => !selectedItemIds.has(i.id)));
                                                setSelectedItemIds(new Set());
                                            } else {
                                                await recordAccess(selectedItemIds.id)
                                                setSelectedFolderId(f.id);
                                            }
                                        }}
                                    >
                                        <div className="folderName">{f.name}</div>

                                        <div className="folderMeta">
                                            {/*<span>#{f.id}</span>*/}

                                            <div className="folderActions">
                                                {/* actionable star toggle */}
                                                <button
                                                    type="button"
                                                    className={`iconBtn starBtn ${f.starred ? "starred" : ""}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onToggleStar(f.id);
                                                    }}
                                                    title={f.starred ? "Unstar" : "Star"}
                                                    aria-label={f.starred ? "Unstar folder" : "Star folder"}
                                                >
                                                    {f.starred ? "★" : "☆"}
                                                </button>

                                                {/* ⋯ overflow menu */}
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
                                                                ✏ Rename
                                                            </button>

                                                            <button
                                                                type="button"
                                                                className="menuItem"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    openPrivacyModal(f);
                                                                }}
                                                            >
                                                                {f.isPublic ? "🔒 Make Private" : "🔓 Make Public"}
                                                            </button>

                                                            <button
                                                                role="menuitem"
                                                                className="menuItem danger"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    openDeleteConfirm(f.id);
                                                                }}
                                                            >
                                                                🗑 Delete
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {filteredItems // only loose items
                                    .map((item) => (
                                        <div
                                            key={item.id}
                                            className={`itemCard
                                            ${organizeMode && selectedItemIds.has(item.id) ? "selectedItem" : ""} 
                                            ${organizeMode ? "organizeModeItem" : ""}`} onClick={() => {
                                            if (organizeMode) {
                                                setSelectedItemIds(prev => {
                                                    const next = new Set(prev);
                                                    if (next.has(item.id)) {
                                                        next.delete(item.id);
                                                    } else {
                                                        next.add(item.id);
                                                    }
                                                    return next;
                                                });
                                            }
                                            else if (item.itemType === "PDF") {
                                                openPDF(item.id);
                                            } else {
                                                navigate(`/sets/${item.id}`);
                                            }
                                        }}
                                        >
                                            <div className="folderName">{item.title}</div>
                                            <div className="folderMeta">
                                                <span className="itemTypeBadge">{item.itemType}</span>
                                                <button
                                                    type="button"
                                                    className={`iconBtn starBtn ${item.starred ? "starred" : ""}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onToggleItemStar(item.id);
                                                    }}
                                                    title={item.starred ? "Unstar" : "Star"}
                                                >
                                                    {item.starred ? "★" : "☆"}
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                            </div>


                        )
                    ) : (
                        /* ─────────────────────────────
                           MODE 2: Folder selected → show folder contents
                           ───────────────────────────── */
                        <div className="folderContents">
                            <button
                                type="button"
                                className="btn cancelBtn"
                                onClick={() => setSelectedFolderId(null)}
                                style={{marginBottom: 12}}
                            >
                                ← Back to folders
                            </button>

                            {itemsLoading ? (
                                <div className="emptyState">Loading items…</div>
                            ) : itemsError ? (
                                <div className="error">{itemsError}</div>
                            ) : items.length === 0 ? (
                                <div className="emptyState">This folder is empty.</div>
                            ) : (
                                <div className="itemsList">
                                    {filteredFolderItems.map((it) => (
                                        <div key={it.id} className="itemCard"
                                             onClick={() => navigate(`/sets/${it.id}`)}>
                                            <div className="folderName">{it.title}</div>
                                            <div className="folderMeta">
                                                <span className="itemTypeBadge">{it.item_type}</span>
                                                <div className="menuWrap"
                                                     ref={openItemMenuId === it.id ? menuRef : null}>
                                                    <button
                                                        type="button"
                                                        className="iconBtn menuTrigger"
                                                        style={{opacity: 1}}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setOpenItemMenuId(openItemMenuId === it.id ? null : it.id);
                                                        }}
                                                        aria-label="Item options"
                                                    >
                                                        ⋯
                                                    </button>
                                                    {openItemMenuId === it.id && (
                                                        <div className="dropdownMenu" role="menu">
                                                            <button
                                                                className="menuItem"
                                                                onClick={async (e) => {
                                                                    e.stopPropagation();
                                                                    await removeItemFromFolder(it.id);
                                                                    setItems(prev => prev.filter(i => i.id !== it.id));
                                                                    setLibItems(prev => [...prev, {...it, folderId: null, itemType: it.item_type ?? it.itemType}]);
                                                                    setOpenItemMenuId(null);
                                                                }}
                                                            >
                                                                ↩ Remove from folder
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
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

                            <div className="modalActions">
                                <button className="btn cancelBtn" type="button" onClick={closeModal}>
                                    Cancel
                                </button>
                                <button className="btn primary" type="submit"
                                        disabled={!modalName.trim() || submitting}>
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

            {privacyId != null && (
                <div className="modalOverlay" onClick={() => setPrivacyId(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modalTitle">
                            {nextIsPublic ? "Make folder public?" : "Make folder private?"}

                        </div>

                        <div className="modalBody">
                            {nextIsPublic ? (
                                <p>
                                    ⚠️ If you set this folder to <b>public</b>, everything in the folder
                                    will be <b>visible to other users</b>.
                                </p>
                            ) : (
                                <p>
                                    ⚠️ If you set this folder to <b>private</b>, everything in the folder
                                    will be <b>hidden from other users</b>.
                                </p>
                            )}
                        </div>

                        <div className="modalActions">
                            <button
                                type="button"
                                className="btn"
                                onClick={() => setPrivacyId(null)}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="btn primary"
                                onClick={confirmPrivacyChange}
                            >
                                {nextIsPublic ? "Make public" : "Make private"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default FoldersPage;