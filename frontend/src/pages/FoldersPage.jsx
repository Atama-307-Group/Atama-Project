import {useEffect, useMemo, useRef, useState} from "react";
import {
    createFolder, getFolders, renameFolder, deleteFolder,
    setFolderStarred,
    getFolderItems,
    setFolderPrivacy,
    getLibraryItems,
    moveItemToFolder,
    removeItemFromFolder,
    uploadPDF,
    recordAccess,
    openPDF,
    toggleItemStarred,
    deleteLibraryItem,
    getLibraryContents,
    getSavedSets,
    getUserGroups,
} from "../api.js";
import {useNavigate} from "react-router-dom";
import "./FoldersPage.css";
import { FolderCard } from "../components/FolderCard.jsx";
import { LibraryItemCard } from "../components/LibraryItemCard.jsx";
import { ConfirmModal } from "../components/ConfirmModal.jsx";

const FoldersPage = ({ userId }) => {
    const navigate = useNavigate();
    const [folders, setFolders] = useState([]);
    const [selectedFolderId, setSelectedFolderId] = useState(null);

    const [studyGroups, setStudyGroups] = useState([]);
    const [studyGroupsLoading, setStudyGroupsLoading] = useState(true);

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
    const [confirmDeleteFolderId, setConfirmDeleteFolderId] = useState(null);
    const [confirmDeleteItemId, setConfirmDeleteItemId] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Overflow menu state
    const [openMenuId, setOpenMenuId] = useState(null);
    const menuRef = useRef(null);

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
    const [openItemMenuId, setOpenItemMenuId] = useState(null);

    // Loose library items
    const [libItems, setLibItems] = useState([]);
    const [savedSets, setSavedSets] = useState([]);

    const [organizeMode, setOrganizeMode] = useState(false);
    const [selectedItemIds, setSelectedItemIds] = useState(new Set());

    const fileInputRef = useRef(null);

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
            if (current <= 10) { header.classList.remove('scrolled'); lastScrollTop = current; return; }
            if (current > lastScrollTop) header.classList.add('scrolled');
            else header.classList.remove('scrolled');
            lastScrollTop = current;
        }
        libraryEl.addEventListener('scroll', handleScroll);
        return () => libraryEl.removeEventListener('scroll', handleScroll);
    }, []);

    // Loading folder items
    useEffect(() => {
        if (selectedFolderId == null) { setItems([]); setItemsError(""); setItemsLoading(false); return; }
        let cancelled = false;
        async function loadItems() {
            setItemsError(""); setItemsLoading(true);
            try {
                const data = await getFolderItems(selectedFolderId);
                if (!cancelled) setItems(Array.isArray(data.items) ? data.items : []);
            } catch (e) {
                if (!cancelled) setItemsError(e.message ?? "Failed to load folder contents");
            } finally {
                if (!cancelled) setItemsLoading(false);
            }
        }
        loadItems();
        return () => { cancelled = true; };
    }, [selectedFolderId]);

    // Loading library
    async function loadLibrary() {
        setError(""); setLoading(true);
        try {
            const data = await getLibraryContents();
            setFolders(Array.isArray(data.folders) ? data.folders : []);
            setLibItems(Array.isArray(data.looseItems) ? data.looseItems : []);
            getSavedSets().then(setSavedSets).catch(() => {});
        } catch (err) {
            setError(err.message ?? "Something went wrong");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { loadLibrary(); }, []);

    useEffect(() => {
        if (!userId) return;
        getUserGroups(userId)
            .then(memberships => setStudyGroups(Array.isArray(memberships) ? memberships : []))
            .catch(() => setStudyGroups([]))
            .finally(() => setStudyGroupsLoading(false));
    }, [userId]);

    function safeTime(x) {
        const t = x ? new Date(x).getTime() : 0;
        return Number.isFinite(t) ? t : 0;
    }

    function compareBySort(a, b, nameKey = "title") {
        switch (sortBy) {
            case "alpha-desc": return (b[nameKey] ?? "").localeCompare(a[nameKey] ?? "");
            case "created-asc": return safeTime(a.createdAt) - safeTime(b.createdAt);
            case "created-desc": return safeTime(b.createdAt) - safeTime(a.createdAt);
            case "accessed-desc": return safeTime(b.lastAccessed) - safeTime(a.lastAccessed);
            case "alpha-asc":
            default: return (a[nameKey] ?? "").localeCompare(b[nameKey] ?? "");
        }
    }

    const filteredFolderItems = useMemo(() => (
        [...items].sort((a, b) => {
            if (a.starred !== b.starred) return a.starred ? -1 : 1;
            return compareBySort(a, b);
        })
    ), [items, sortBy]);

    const filteredItems = useMemo(() => {
        const q = query.trim().toLowerCase();
        return libItems
            .filter(item => item.title?.toLowerCase().includes(q) && !item.folderId)
            .sort((a, b) => {
                if (a.starred !== b.starred) return a.starred ? -1 : 1;
                const primary = compareBySort(a, b);
                return primary !== 0 ? primary : (a.title ?? "").localeCompare(b.title ?? "");
            });
    }, [libItems, query, sortBy]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return folders
            .filter(f => f.name.toLowerCase().includes(q))
            .sort((a, b) => {
                if (a.starred !== b.starred) return a.starred ? -1 : 1;
                const primary = compareBySort(a, b, "name");
                if (primary !== 0) return primary;
                const byName = (a.name ?? "").localeCompare(b.name ?? "");
                return byName !== 0 ? byName : (a.id ?? 0) - (b.id ?? 0);
            });
    }, [folders, query, sortBy]);

    useEffect(() => {
        if (!showSortMenu) return;
        function handlePointerDown(e) {
            if (sortMenuRef.current && !sortMenuRef.current.contains(e.target)) setShowSortMenu(false);
        }
        window.addEventListener("pointerdown", handlePointerDown);
        return () => window.removeEventListener("pointerdown", handlePointerDown);
    }, [showSortMenu]);

    const selected = useMemo(() => folders.find((f) => f.id === selectedFolderId) ?? null, [folders, selectedFolderId]);

    // ── Create folder ─────────────────────────────────────────────────────────

    function closeModal() { setShowModal(false); setModalName(""); }

    async function onCreateFromModal(e) {
        e.preventDefault();
        const name = modalName.trim();
        if (!name || submitting) return;
        setError(""); setSubmitting(true);
        try {
            const created = await createFolder({name});
            setFolders((prev) => [created, ...prev]);
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
            if (ev.key !== "Escape") return;
            if (showModal) closeModal();
            if (renameId !== null) closeRenameModal();
            if (confirmDeleteFolderId !== null) setConfirmDeleteFolderId(null);
            if (confirmDeleteItemId !== null) setConfirmDeleteItemId(null);
            if (privacyId !== null) setPrivacyId(null);
            if (showSortMenu) setShowSortMenu(false);
            if (renameItemId !== null) closeRenameItemModal();
            setOpenMenuId(null);
        }
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [showModal, renameId, confirmDeleteFolderId, confirmDeleteItemId, privacyId, showSortMenu]);

    // ── Star toggles ──────────────────────────────────────────────────────────

    async function onToggleStar(folderId) {
        const prev = folders;
        setFolders((curr) => curr.map((f) => (f.id === folderId ? {...f, starred: !f.starred} : f)));
        try {
            const folder = folders.find((f) => f.id === folderId);
            const updated = await setFolderStarred(folderId, !folder.starred);
            setFolders((curr) => curr.map((f) => (f.id === folderId ? updated : f)));
        } catch (e) {
            setError(e.message ?? "Failed to update star");
            setFolders(prev);
        }
    }

    async function onToggleItemStar(itemId) {
        const prev = libItems;
        setLibItems((curr) => curr.map((i) => (i.id === itemId ? {...i, starred: !i.starred} : i)));
        try {
            const updated = await toggleItemStarred(itemId);
            setLibItems((curr) => curr.map((i) => (i.id === itemId ? {...i, starred: updated.starred} : i)));
        } catch (e) {
            setError(e.message ?? "Failed to update star");
            setLibItems(prev);
        }
    }

    // ── Delete folder ─────────────────────────────────────────────────────────

    async function confirmDeleteFolder() {
        const id = confirmDeleteFolderId;
        setConfirmDeleteFolderId(null);
        try {
            await deleteFolder(id);
            if (selectedFolderId === id) { setItems([]); setSelectedFolderId(null); }
            await loadLibrary();
        } catch (err) {
            setError(err.message ?? "Failed to delete folder");
        }
    }

    // ── Delete library item ───────────────────────────────────────────────────

    async function confirmDeleteItem() {
        const id = confirmDeleteItemId;
        setConfirmDeleteItemId(null);
        try {
            await deleteLibraryItem(id);
            setLibItems((prev) => prev.filter((i) => i.id !== id));
        } catch (err) {
            setError(err.message ?? "Failed to delete item");
        }
    }

    // Rename item state
    const [renameItemId, setRenameItemId] = useState(null);
    const [renameItemName, setRenameItemName] = useState("");

    function openRenameItemModal(item) {
        setRenameItemId(item.id);
        setRenameItemName(item.title ?? "");
    }

    function closeRenameItemModal() {
        setRenameItemId(null);
        setRenameItemName("");
    }

    async function onRenameItemSubmit(e) {
        e.preventDefault();
        const title = renameItemName.trim();
        if (!title) return;
        try {
            await renameLibraryItem(renameItemId, title);
            setLibItems(prev => prev.map(i => i.id === renameItemId ? { ...i, title } : i));
            closeRenameItemModal();
        } catch (err) {
            setError(err.message ?? "Failed to rename item");
        }
    }

    // ── Move item to folder ───────────────────────────────────────────────────

    async function onMoveItemToFolder(itemId, folderId) {
        try {
            await moveItemToFolder(itemId, folderId);
            setLibItems((prev) => prev.filter((i) => i.id !== itemId));
        } catch (err) {
            setError(err.message ?? "Failed to move item");
        }
    }

    // ── Rename folder ─────────────────────────────────────────────────────────

    function openRenameModal(folder) { setOpenMenuId(null); setRenameId(folder.id); setRenameName(folder.name ?? ""); }
    function closeRenameModal() { setRenameId(null); setRenameName(""); }

    async function onRenameSubmit(e) {
        e.preventDefault();
        const name = renameName.trim();
        if (!name) return;
        setError("");
        try {
            await renameFolder(renameId, name);
            setFolders((prev) => prev.map((f) => (f.id === renameId ? {...f, name} : f)));
            closeRenameModal();
        } catch (err) {
            setError(err.message ?? "Failed to rename folder");
        }
    }

    // ── Privacy modal ─────────────────────────────────────────────────────────

    function openPrivacyModal(folder) { setPrivacyId(folder.id); setNextIsPublic(!folder.isPublic); setOpenMenuId(null); }

    async function confirmPrivacyChange() {
        if (privacyId == null) return;
        const prevFolders = folders;
        setPrivacyId(null);
        try {
            const updated = await setFolderPrivacy(privacyId, nextIsPublic);
            setFolders((prev) => prev.map((f) => f.id === updated.id ? {...f, isPublic: updated.isPublic} : f));
        } catch (e) {
            setError(e.message ?? "Failed to update privacy");
            setFolders(prevFolders);
        }
    }

    // ── Upload ────────────────────────────────────────────────────────────────

    async function onUploadPDF(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const newItem = await uploadPDF(file);
            setLibItems(prev => [{...newItem, folderId: null}, ...prev]);
        } catch (err) {
            setError(err.message ?? "Failed to upload PDF");
        }
    }

    // ── Main render ───────────────────────────────────────────────────────────

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

                <button className="btn primary" onClick={() => navigate('/create')} type="button">New Flashcard Set</button>

                <button className="btn secondary" type="button" onClick={() => fileInputRef.current.click()}>Upload PDF</button>
                <input ref={fileInputRef} type="file" accept=".pdf" style={{display: "none"}} onChange={onUploadPDF} />

                <button className="btn ghost" onClick={() => setShowModal(true)} disabled={selectedFolderId !== null} type="button">New Folder</button>

                <button
                    type="button"
                    className={`btn ${organizeMode ? "primary" : "organize"}`}
                    onClick={() => { setOrganizeMode(p => !p); setSelectedItemIds(new Set()); }}
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

                {error && <div className="error">{error}</div>}
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
                                {Object.entries(SORT_LABELS).map(([key, label]) => (
                                    <button key={key} className="menuItem" onClick={() => { setSortBy(key); setShowSortMenu(false); }}>
                                        {label}
                                    </button>
                                ))}
                            </div>
                        )}


                    </div>
                </header>

                <section className="libraryBody">
                    {selectedFolderId == null ? (
                        loading ? (
                            <div className="emptyState">Gathering your library …</div>
                        ) : filtered.length === 0 && filteredItems.length === 0 ? (
                            <div className="emptyState">No items found.</div>
                        ) : (
                            <div className="folderGrid">
                                {filtered.map((f) => (
                                    <FolderCard
                                        key={f.id}
                                        folder={f}
                                        organizeMode={organizeMode}
                                        hasSelection={selectedItemIds.size > 0}
                                        openMenuId={openMenuId}
                                        setOpenMenuId={setOpenMenuId}
                                        menuRef={menuRef}
                                        onToggleStar={onToggleStar}
                                        onRenameModal={openRenameModal}
                                        onPrivacyModal={openPrivacyModal}
                                        onDeleteConfirm={(id) => { setOpenMenuId(null); setConfirmDeleteFolderId(id); }}
                                        onClick={async () => {
                                            if (organizeMode && selectedItemIds.size > 0) {
                                                await Promise.all([...selectedItemIds].map(id => moveItemToFolder(id, f.id)));
                                                setLibItems(prev => prev.filter(i => !selectedItemIds.has(i.id)));
                                                setSelectedItemIds(new Set());
                                            } else {
                                                setSelectedFolderId(f.id);
                                            }
                                        }}
                                    />
                                ))}

                                {filteredItems.length > 0 && <div className="sectionDivider">My Sets</div>}

                                {filteredItems.map((item) => (
                                    <LibraryItemCard
                                        key={item.id}
                                        item={item}
                                        organizeMode={organizeMode}
                                        isSelected={selectedItemIds.has(item.id)}
                                        folders={folders}
                                        onToggleStar={onToggleItemStar}
                                        onMoveToFolder={onMoveItemToFolder}
                                        onDelete={(id) => setConfirmDeleteItemId(id)}
                                        onRename={openRenameItemModal}
                                        onClick={() => {
                                            if (organizeMode) {
                                                setSelectedItemIds(prev => {
                                                    const next = new Set(prev);
                                                    next.has(item.id) ? next.delete(item.id) : next.add(item.id);
                                                    return next;
                                                });
                                            } else if (item.itemType === "PDF") {
                                                openPDF(item.id);
                                            } else if (item.itemType === "CONCEPT_MAP" || item.item_type === "CONCEPT_MAP") {
                                                navigate(`/concept-maps/${item.id}`);
                                            } else {
                                                navigate(`/sets/${item.id}`);
                                            }
                                        }}
                                    />
                                ))}

                                {savedSets.length > 0 && (
                                    <>
                                        <div className="sectionDivider">Saved Sets</div>
                                        {savedSets.map((set) => (
                                            <div key={set.id} className="itemCard" onClick={() => navigate(`/sets/${set.id}`)}>
                                                <div className="folderName">{set.title}</div>
                                                <div className="folderMeta">
                                                    <span className="itemTypeBadge">SAVED</span>
                                                    {set.university && <span className="itemTypeBadge">{set.university}</span>}
                                                </div>
                                            </div>
                                        ))}
                                    </>
                                )}

                                {!studyGroupsLoading && studyGroups.length > 0 && (
                                    <>
                                        <div className="sectionDivider">Study Groups</div>
                                        {studyGroups.map((membership) => {
                                            const g = membership.group;
                                            if (!g) return null;
                                            const courseName = g.course?.courseCode ?? g.course?.courseName ?? null;
                                            return (
                                                <div
                                                    key={g.id}
                                                    className="itemCard studyGroupItem"
                                                    onClick={() => navigate(`/groups/${g.id}`)}
                                                >
                                                    <div className="folderName">{g.name}</div>
                                                    <div className="folderMeta">
                                                        <span className={`itemTypeBadge studyGroupPrivacy--${g.privacy?.toLowerCase()}`}>
                                                            {g.privacy}
                                                        </span>
                                                        {courseName && (
                                                            <span className="itemTypeBadge">{courseName}</span>
                                                        )}
                                                        {membership.role === "OWNER" && (
                                                            <span className="itemTypeBadge ownerBadge">Owner</span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </>
                                )}
                            </div>
                        )
                    ) : (
                        /* Folder contents view */
                        <div className="folderContents">
                            <button type="button" className="btn cancelBtn" onClick={() => setSelectedFolderId(null)} style={{marginBottom: 12}}>
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
                                        <div key={it.id} className="itemCard" onClick={() => {
                                                 if (it.itemType === "PDF" || it.item_type === "PDF") {
                                                     openPDF(it.id);
                                                 } else if (it.itemType === "CONCEPT_MAP" || it.item_type === "CONCEPT_MAP") {
                                                     navigate(`/concept-maps/${it.id}`);
                                                 } else {
                                                     navigate(`/sets/${it.id}`);
                                                 }
                                             }}>
                                            <div className="folderName">{it.title}</div>
                                            <div className="folderMeta">
                                                <span className="itemTypeBadge">{it.item_type || it.itemType}</span>
                                                <div className="menuWrap" ref={openItemMenuId === it.id ? menuRef : null}>
                                                    <button
                                                        type="button"
                                                        className="iconBtn menuTrigger"
                                                        style={{opacity: 1}}
                                                        onClick={(e) => { e.stopPropagation(); setOpenItemMenuId(openItemMenuId === it.id ? null : it.id); }}
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
                    <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="createModalTitle">
                        <div className="modalTitle" id="createModalTitle">Create folder</div>
                        <form onSubmit={onCreateFromModal} className="modalForm">
                            <input className="modalInput" placeholder="Folder name…" value={modalName} onChange={(e) => setModalName(e.target.value)} autoFocus />
                            <div className="modalActions">
                                <button className="btn cancelBtn" type="button" onClick={closeModal}>Cancel</button>
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
                    <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
                        <div className="modalTitle">Rename folder</div>
                        <form onSubmit={onRenameSubmit} className="modalForm">
                            <input className="modalInput" placeholder="New name…" value={renameName} onChange={(e) => setRenameName(e.target.value)} autoFocus onFocus={(e) => e.target.select()} />
                            <div className="modalActions">
                                <button className="btn cancelBtn" type="button" onClick={closeRenameModal}>Cancel</button>
                                <button className="btn primary" type="submit" disabled={!renameName.trim()}>Rename</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete folder confirm */}
            {confirmDeleteFolderId !== null && (
                <ConfirmModal
                    title="Delete folder?"
                    confirmLabel="Yes, delete"
                    confirmClassName="btn danger"
                    onConfirm={confirmDeleteFolder}
                    onCancel={() => setConfirmDeleteFolderId(null)}
                >
                    <p>Are you sure you want to delete this folder? The items inside will <strong>NOT</strong> be deleted.</p>
                </ConfirmModal>
            )}

            {/* Delete item confirm */}
            {confirmDeleteItemId !== null && (
                <ConfirmModal
                    title="Delete item?"
                    confirmLabel="Yes, delete"
                    confirmClassName="btn danger"
                    onConfirm={confirmDeleteItem}
                    onCancel={() => setConfirmDeleteItemId(null)}
                >
                    <p>Are you sure you want to permanently delete this item? This cannot be undone.</p>
                </ConfirmModal>
            )}

            {/* Privacy modal */}
            {privacyId != null && (
                <div className="modalOverlay" onClick={() => setPrivacyId(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modalTitle">{nextIsPublic ? "Make folder public?" : "Make folder private?"}</div>
                        <div className="modalBody">
                            {nextIsPublic ? (
                                <p>⚠️ If you set this folder to <b>public</b>, everything in the folder will be <b>visible to other users</b>.</p>
                            ) : (
                                <p>⚠️ If you set this folder to <b>private</b>, everything in the folder will be <b>hidden from other users</b>.</p>
                            )}
                        </div>
                        <div className="modalActions">
                            <button type="button" className="btn" onClick={() => setPrivacyId(null)}>Cancel</button>
                            <button type="button" className="btn primary" onClick={confirmPrivacyChange}>
                                {nextIsPublic ? "Make public" : "Make private"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        {renameItemId !== null && (
                                <div className="modalOverlay" onClick={closeRenameItemModal}>
                                    <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
                                        <div className="modalTitle">Rename item</div>
                                        <form onSubmit={onRenameItemSubmit} className="modalForm">
                                            <input
                                                className="modalInput"
                                                placeholder="New name…"
                                                value={renameItemName}
                                                onChange={(e) => setRenameItemName(e.target.value)}
                                                autoFocus
                                                onFocus={(e) => e.target.select()}
                                            />
                                            <div className="modalActions">
                                                <button className="btn cancelBtn" type="button" onClick={closeRenameItemModal}>Cancel</button>
                                                <button className="btn primary" type="submit" disabled={!renameItemName.trim()}>Rename</button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}
        </div>
    );
}

export default FoldersPage;