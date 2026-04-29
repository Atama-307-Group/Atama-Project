import {useEffect, useMemo, useRef, useState} from "react";
import {
    createFolder, getFolders, renameFolder, deleteFolder,
    setFolderStarred,
    getFolderItems,
    setFolderPrivacy,
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
    deleteFlashcardSet,
} from "../api.js";
import {useNavigate} from "react-router-dom";
import "./FoldersPage.css";
import BackButton from "../components/BackButton.jsx";
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
    async function loadFolderItems(folderId) {
        if (folderId == null) { setItems([]); setItemsError(""); setItemsLoading(false); return; }
        setItemsError(""); setItemsLoading(true);
        try {
            const data = await getFolderItems(folderId);
            setItems(Array.isArray(data.items) ? data.items : []);
        } catch (e) {
            setItemsError(e.message ?? "Failed to load folder contents");
        } finally {
            setItemsLoading(false);
        }
    }

    useEffect(() => {
        if (selectedFolderId != null) loadFolderItems(selectedFolderId);
        else { setItems([]); setItemsError(""); setItemsLoading(false); }
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
        let allItems = libItems;
        if (q) {
            const insideFolders = folders.flatMap(f => (f.items || []).map(i => ({...i, folderId: f.id})));
            // Remove duplicates by ID in case any exist
            const uniqItems = new Map();
            allItems.forEach(i => uniqItems.set(i.id, i));
            insideFolders.forEach(i => uniqItems.set(i.id, i));
            allItems = Array.from(uniqItems.values());
        }
        return allItems
            .filter(item => {
                const matches = item.title?.toLowerCase().includes(q);
                return q ? matches : (matches && !item.folderId);
            })
            .sort((a, b) => {
                if (a.starred !== b.starred) return a.starred ? -1 : 1;
                const primary = compareBySort(a, b);
                return primary !== 0 ? primary : (a.title ?? "").localeCompare(b.title ?? "");
            });
    }, [libItems, folders, query, sortBy]);

    const filteredSavedSets = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return savedSets;
        return savedSets.filter(set => set.title?.toLowerCase().includes(q));
    }, [savedSets, query]);

    const filteredStudyGroups = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return studyGroups;
        return studyGroups.filter(m => {
            const g = m.group;
            if (!g) return false;
            return g.name?.toLowerCase().includes(q) || 
                   g.course?.courseCode?.toLowerCase().includes(q) || 
                   g.course?.courseName?.toLowerCase().includes(q);
        });
    }, [studyGroups, query]);

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

    async function onRemoveItemFromFolder(itemId) {
        try {
            await removeItemFromFolder(itemId);
            if (selectedFolderId) {
                setItems(prev => prev.filter(i => i.id !== itemId));
            }
            await loadLibrary();
        } catch (err) {
            setError(err.message ?? "Failed to remove item from folder");
        }
    }

    // ── Rename folder ─────────────────────────────────────────────────────────

    function openRenameModal(folder) { setOpenMenuId(null); setRenameId(folder.id); setRenameName(folder.name ?? ""); }


    // ── Drag & Drop Logic ───────────────────────────────────────────────────
    const handleDragStart = (e, itemId) => {
        if (!organizeMode) return;
        // If the item being dragged isn't selected, select only it
        if (!selectedItemIds.has(itemId)) {
            setSelectedItemIds(new Set([itemId]));
        }
        e.dataTransfer.setData("text/plain", itemId);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e) => {
        if (!organizeMode) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        e.currentTarget.classList.add("folderDropTargetActive");
    };

    const handleDragLeave = (e) => {
        e.currentTarget.classList.remove("folderDropTargetActive");
    };

    const handleDrop = async (e, targetFolderId) => {
        if (!organizeMode) return;
        e.preventDefault();
        e.currentTarget.classList.remove("folderDropTargetActive");

        const itemsToMove = selectedItemIds.size > 0 
            ? Array.from(selectedItemIds) 
            : [e.dataTransfer.getData("text/plain")];

        if (itemsToMove.length === 0) return;

        try {
            await Promise.all(itemsToMove.map(id => moveItemToFolder(id, targetFolderId)));
            setSelectedItemIds(new Set());
            if (selectedFolderId) await loadFolderItems(selectedFolderId);
            await loadLibrary();
        } catch (err) {
            setError("Failed to move items: " + err.message);
        }
    };

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
        <div className="foldersPage">
            <header className="libraryHeader">
                <BackButton />
                <div className="libraryTitle">Your Library</div>
            </header>

            <div className="libraryToolbar">
                <button 
                    className="toolbarActionBtn primary" 
                    onClick={() => navigate('/create')}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    New Flashcard Set
                </button>

                <button 
                    className="toolbarActionBtn" 
                    onClick={() => fileInputRef.current.click()}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    Upload PDF
                </button>
                <input ref={fileInputRef} type="file" accept=".pdf" style={{display: "none"}} onChange={onUploadPDF} />

                <button 
                    className="toolbarActionBtn" 
                    onClick={() => setShowModal(true)} 
                    disabled={selectedFolderId !== null}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                    </svg>
                    New Folder
                </button>

                <button
                    className={`toolbarActionBtn ${organizeMode ? "primary" : ""}`}
                    onClick={() => { setOrganizeMode(p => !p); setSelectedItemIds(new Set()); }}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 11 12 14 22 4" />
                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                    </svg>
                    {organizeMode ? "Done" : "Organize"}
                </button>

                <div className="librarySearchWrap">
                    <input
                        id="folder-search"
                        className="librarySearchInput"
                        placeholder="Search your library…"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>

                <div className="sortWrap" ref={sortMenuRef}>
                    <button
                        type="button"
                        className="toolbarActionBtn"
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
            </div>

            {error && <div className="courseError" style={{marginTop: 16}}>{error}</div>}

            <main className="library" style={{marginTop: 24}}>
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
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={(e) => handleDrop(e, f.id)}
                                        onClick={async () => {
                                            if (organizeMode && selectedItemIds.size > 0) {
                                                await Promise.all([...selectedItemIds].map(id => moveItemToFolder(id, f.id)));
                                                setSelectedItemIds(new Set());
                                                await loadLibrary();
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
                                        onRemoveFromFolder={item.folderId ? onRemoveItemFromFolder : null}
                                        onDelete={(id) => setConfirmDeleteItemId(id)}
                                        onRename={openRenameItemModal}
                                        onDragStart={(e) => handleDragStart(e, item.id)}
                                        onClick={() => {
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

                                {filteredSavedSets.length > 0 && (
                                    <>
                                        <div className="sectionDivider">Saved Sets</div>
                                        {filteredSavedSets.map((set) => (
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

                                {!studyGroupsLoading && filteredStudyGroups.length > 0 && (
                                    <>
                                        <div className="sectionDivider">Study Groups</div>
                                        {filteredStudyGroups.map((membership) => {
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
                            <button type="button" className="toolbarActionBtn" onClick={() => setSelectedFolderId(null)} style={{marginBottom: 16}}>
                                ← Back to main library
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
                                        <LibraryItemCard
                                            key={it.id}
                                            item={{...it, itemType: it.item_type || it.itemType}}
                                            organizeMode={organizeMode}
                                            isSelected={selectedItemIds.has(it.id)}
                                            onToggleStar={onToggleItemStar}
                                            onDelete={(id) => setConfirmDeleteItemId(id)}
                                            onRename={openRenameItemModal}
                                            onRemoveFromFolder={onRemoveItemFromFolder}
                                            onDragStart={(e) => handleDragStart(e, it.id)}
                                            onClick={() => {
                                                if (organizeMode) {
                                                    setSelectedItemIds(prev => {
                                                        const next = new Set(prev);
                                                        next.has(it.id) ? next.delete(it.id) : next.add(it.id);
                                                        return next;
                                                    });
                                                } else if (it.itemType === "PDF" || it.item_type === "PDF") {
                                                    openPDF(it.id);
                                                } else if (it.itemType === "CONCEPT_MAP" || it.item_type === "CONCEPT_MAP") {
                                                    navigate(`/concept-maps/${it.id}`);
                                                } else {
                                                    navigate(`/sets/${it.id}`);
                                                }
                                            }}
                                        />
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