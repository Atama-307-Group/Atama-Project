import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getCourse, unenrollFromCourse, uploadPDFToCourse, getCourseItems, openPDF, downloadPDF, getLibraryItems,
    addLibraryItemToCourse, updateCourseLibraryItem, deleteCourseLibraryItem, getGroupsByCourse } from "../api.js";
import "./CoursePage.css";
import Highlighted from "../components/Highlighted.jsx";

const YEARS = ["Unknown", ...Array.from({ length: 10 }, (_, i) => String(new Date().getFullYear() - i))];
const NUMERIC_YEARS = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);
const SEMESTERS = ["Unknown", "Fall", "Spring", "Summer", "Winter"];
const ITEM_TYPES = ["PDF", "FLASHCARD_SET", "PRACTICE_TEST"];

const SORT_LABELS = {
    "alpha-asc": "Alphabetical (A → Z)",
    "alpha-desc": "Alphabetical (Z → A)",
    "created-desc": "Date added (Newest)",
    "created-asc": "Date added (Oldest)",
    "accessed-desc": "Last accessed by you"
};

const CoursePage = ({ userId }) => {
    const navigate = useNavigate();
    const { courseId } = useParams();
    const [course, setCourse] = useState(null);
    const [showLeaveModal, setShowLeaveModal] = useState(false);
    const [leaving, setLeaving] = useState(false);

    // Course library items
    const [items, setItems] = useState([]);
    const [itemsLoading, setItemsLoading] = useState(true);
    const [itemsError, setItemsError] = useState("");

    // Sorting
    const [sortBy, setSortBy] = useState("alpha-asc");
    const [showSortMenu, setShowSortMenu] = useState(false);
    const sortMenuRef = useRef(null);

    // Search
    const [query, setQuery] = useState("");

    // Filters
    const [showFilterPanel, setShowFilterPanel] = useState(false);
    const [filterTypes, setFilterTypes] = useState(new Set());
    const [filterSemesters, setFilterSemesters] = useState(new Set());
    const [filterYearMin, setFilterYearMin] = useState(NUMERIC_YEARS[NUMERIC_YEARS.length - 1]);
    const [filterYearMax, setFilterYearMax] = useState(NUMERIC_YEARS[0]);
    const [filterIncludeUnknownYear, setFilterIncludeUnknownYear] = useState(true);
    const filterPanelRef = useRef(null);

    // PDF upload modal
    const fileInputRef = useRef(null);
    const [pendingFile, setPendingFile] = useState(null);
    const [showPDFModal, setShowPDFModal] = useState(false);
    const [pdfTitle, setPdfTitle] = useState("");
    const [pdfYear, setPdfYear] = useState("Unknown");
    const [pdfSemester, setPdfSemester] = useState("Unknown");
    const [pdfDescription, setPdfDescription] = useState("");
    const [uploading, setUploading] = useState(false);

    const [error, setError] = useState("");

    // Study groups preview
    const [groups, setGroups] = useState([]);
    const [groupsLoading, setGroupsLoading] = useState(true);

    // Add from personal library
    const [showLibraryModal, setShowLibraryModal] = useState(false);
    const [libraryItems, setLibraryItems] = useState([]);
    const [libraryLoading, setLibraryLoading] = useState(false);
    const [libraryError, setLibraryError] = useState("");
    const [librarySearch, setLibrarySearch] = useState("");
    const [selectedLibraryItem, setSelectedLibraryItem] = useState(null);

    const [showLibMetaModal, setShowLibMetaModal] = useState(false);
    const [libMetaYear, setLibMetaYear] = useState("Unknown");
    const [libMetaSemester, setLibMetaSemester] = useState("Unknown");
    const [libMetaDescription, setLibMetaDescription] = useState("");
    const [libMetaAdding, setLibMetaAdding] = useState(false);

    // Edit / delete your own items
    const [openMenuId, setOpenMenuId] = useState(null);
    const [editingItem, setEditingItem] = useState(null);
    const [editYear, setEditYear] = useState("Unknown");
    const [editSemester, setEditSemester] = useState("Unknown");
    const [editDescription, setEditDescription] = useState("");
    const [editSaving, setEditSaving] = useState(false);
    const [deletingItem, setDeletingItem] = useState(null);
    const [deleteConfirming, setDeleteConfirming] = useState(false);

    useEffect(() => {
        if (!courseId) return;
        getCourse(courseId).then(setCourse).catch(console.error);
    }, [courseId]);

    useEffect(() => {
        if (!courseId) return;
        setItemsLoading(true);
        getCourseItems(courseId)
            .then(data => setItems(Array.isArray(data) ? data : []))
            .catch(e => setItemsError(e.message ?? "Failed to load course items"))
            .finally(() => setItemsLoading(false));
    }, [courseId]);

    useEffect(() => {
        if (!courseId) return;
        getGroupsByCourse(courseId)
            .then(data => setGroups(Array.isArray(data) ? data : []))
            .catch(() => setGroups([]))
            .finally(() => setGroupsLoading(false));
    }, [courseId]);

    useEffect(() => {
        if (!showSortMenu) return;
        function handlePointerDown(e) {
            if (sortMenuRef.current && !sortMenuRef.current.contains(e.target)) setShowSortMenu(false);
        }
        window.addEventListener("pointerdown", handlePointerDown);
        return () => window.removeEventListener("pointerdown", handlePointerDown);
    }, [showSortMenu]);

    useEffect(() => {
        if (!showFilterPanel) return;
        function handlePointerDown(e) {
            if (filterPanelRef.current && !filterPanelRef.current.contains(e.target)) setShowFilterPanel(false);
        }
        window.addEventListener("pointerdown", handlePointerDown);
        return () => window.removeEventListener("pointerdown", handlePointerDown);
    }, [showFilterPanel]);

    useEffect(() => {
        function onKeyDown(e) {
            if (e.key === "Escape") {
                setShowPDFModal(false);
                setShowLeaveModal(false);
                setShowSortMenu(false);
                setShowFilterPanel(false);
                setShowLibraryModal(false);
                setShowLibMetaModal(false);
                setOpenMenuId(null);
                setEditingItem(null);
                setDeletingItem(null);
            }
        }
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, []);

    useEffect(() => {
        if (!openMenuId) return;
        function handlePointerDown() { setOpenMenuId(null); }
        window.addEventListener("pointerdown", handlePointerDown);
        return () => window.removeEventListener("pointerdown", handlePointerDown);
    }, [openMenuId]);

    const activeFilterCount = useMemo(() => {
        let n = 0;
        if (filterTypes.size > 0) n++;
        if (filterSemesters.size > 0) n++;
        const yearMin = NUMERIC_YEARS[NUMERIC_YEARS.length - 1];
        const yearMax = NUMERIC_YEARS[0];
        if (filterYearMin !== yearMin || filterYearMax !== yearMax || !filterIncludeUnknownYear) n++;
        return n;
    }, [filterTypes, filterSemesters, filterYearMin, filterYearMax, filterIncludeUnknownYear]);

    const addedLibraryItemIds = useMemo(
        () => new Set(items.map(cli => cli.libraryItem?.id).filter(Boolean)),
        [items]
    );

    const filteredLibraryItems = useMemo(() => {
        const q = librarySearch.trim().toLowerCase();
        if (!q) return libraryItems;
        return libraryItems.filter(li =>
            (li.title ?? "").toLowerCase().includes(q) ||
            (li.description ?? "").toLowerCase().includes(q)
        );
    }, [libraryItems, librarySearch]);

    const filteredItems = useMemo(() => {
        const q = query.trim().toLowerCase();

        function safeTime(x) {
            const t = x ? new Date(x).getTime() : 0;
            return Number.isFinite(t) ? t : 0;
        }

        function compareBySort(a, b) {
            const titleA = a.libraryItem?.title ?? "";
            const titleB = b.libraryItem?.title ?? "";
            switch (sortBy) {
                case "alpha-desc": return titleB.localeCompare(titleA);
                case "created-asc": return safeTime(a.libraryItem?.createdAt) - safeTime(b.libraryItem?.createdAt);
                case "created-desc": return safeTime(b.libraryItem?.createdAt) - safeTime(a.libraryItem?.createdAt);
                case "accessed-desc": return safeTime(b.libraryItem?.lastAccessed) - safeTime(a.libraryItem?.lastAccessed);
                case "alpha-asc":
                default: return titleA.localeCompare(titleB);
            }
        }

        return [...items]
            .filter(item => {
                if (q) {
                    const titleMatch = (item.libraryItem?.title ?? "").toLowerCase().includes(q);
                    const descMatch = (item.description ?? "").toLowerCase().includes(q);
                    if (!titleMatch && !descMatch) return false;
                }
                if (filterTypes.size > 0) {
                    const type = item.libraryItem?.itemType ?? "PDF";
                    if (!filterTypes.has(type)) return false;
                }
                if (filterSemesters.size > 0) {
                    const sem = item.semester ?? "Unknown";
                    if (!filterSemesters.has(sem)) return false;
                }
                const itemYear = item.year ?? "Unknown";
                if (itemYear === "Unknown") {
                    if (!filterIncludeUnknownYear) return false;
                } else {
                    const y = parseInt(itemYear, 10);
                    if (Number.isFinite(y) && (y < filterYearMin || y > filterYearMax)) return false;
                }
                return true;
            })
            .sort(compareBySort);
    }, [items, query, sortBy, filterTypes, filterSemesters, filterYearMin, filterYearMax, filterIncludeUnknownYear]);

    function toggleSet(setter, value) {
        setter(prev => {
            const next = new Set(prev);
            next.has(value) ? next.delete(value) : next.add(value);
            return next;
        });
    }

    function clearFilters() {
        setFilterTypes(new Set());
        setFilterSemesters(new Set());
        setFilterYearMin(NUMERIC_YEARS[NUMERIC_YEARS.length - 1]);
        setFilterYearMax(NUMERIC_YEARS[0]);
        setFilterIncludeUnknownYear(true);
    }

    function handleFileChange(e) {
        const file = e.target.files[0];
        if (!file) return;
        const rawName = file.name.replace(/\.pdf$/i, "");
        setPendingFile(file);
        setPdfTitle(rawName);
        setPdfYear("Unknown");
        setPdfSemester("Unknown");
        setPdfDescription("");
        setShowPDFModal(true);
        e.target.value = "";
    }

    async function handlePDFConfirm() {
        if (!pendingFile) return;
        setUploading(true);
        try {
            const newItem = await uploadPDFToCourse(pendingFile, pdfTitle, pdfYear, pdfSemester, pdfDescription || null, courseId);
            setItems(prev => [newItem, ...prev]);
            setShowPDFModal(false);
            setPendingFile(null);
        } catch (err) {
            setError(err.message ?? "Failed to upload PDF");
        } finally {
            setUploading(false);
        }
    }

    async function handleLeave() {
        setLeaving(true);
        try {
            await unenrollFromCourse(userId, courseId);
            navigate(-1);
        } catch (err) {
            console.error(err);
        } finally {
            setLeaving(false);
        }
    }

    async function handleOpenLibraryModal() {
        setShowLibraryModal(true);
        setLibrarySearch("");
        setSelectedLibraryItem(null);
        setLibraryError("");
        setLibraryLoading(true);
        try {
            const data = await getLibraryItems();
            setLibraryItems(Array.isArray(data) ? data : []);
        } catch (e) {
            setLibraryError(e.message ?? "Failed to load library items");
        } finally {
            setLibraryLoading(false);
        }
    }

    function handleLibraryNext() {
        if (!selectedLibraryItem) return;
        setLibMetaYear("Unknown");
        setLibMetaSemester("Unknown");
        setLibMetaDescription("");
        setShowLibraryModal(false);
        setShowLibMetaModal(true);
    }

    async function handleLibMetaConfirm() {
        if (!selectedLibraryItem) return;
        setLibMetaAdding(true);
        try {
            const newItem = await addLibraryItemToCourse(
                selectedLibraryItem.id,
                courseId,
                libMetaYear,
                libMetaSemester,
                libMetaDescription || null,
            );
            setItems(prev => [newItem, ...prev]);
            setShowLibMetaModal(false);
            setSelectedLibraryItem(null);
        } catch (err) {
            setError(err.message ?? "Failed to add item to course");
            setShowLibMetaModal(false);
        } finally {
            setLibMetaAdding(false);
        }
    }

    function handleLibMetaBack() {
        setShowLibMetaModal(false);
        setShowLibraryModal(true);
    }

    function handleOpenEdit(e, cli) {
        e.stopPropagation();
        setOpenMenuId(null);
        setEditingItem(cli);
        setEditYear(cli.year ?? "Unknown");
        setEditSemester(cli.semester ?? "Unknown");
        setEditDescription(cli.description ?? "");
    }

    async function handleEditSave() {
        if (!editingItem) return;
        setEditSaving(true);
        try {
            const updated = await updateCourseLibraryItem(
                editingItem.id,
                editYear,
                editSemester,
                editDescription || null,
            );
            setItems(prev => prev.map(i => i.id === updated.id ? updated : i));
            setEditingItem(null);
        } catch (err) {
            setError(err.message ?? "Failed to save changes");
        } finally {
            setEditSaving(false);
        }
    }

    async function handleDeleteConfirm() {
        if (!deletingItem) return;
        setDeleteConfirming(true);
        try {
            await deleteCourseLibraryItem(deletingItem.id);
            setItems(prev => prev.filter(i => i.id !== deletingItem.id));
            setDeletingItem(null);
        } catch (err) {
            setError(err.message ?? "Failed to remove item");
        } finally {
            setDeleteConfirming(false);
        }
    }

    const yearMin = NUMERIC_YEARS[NUMERIC_YEARS.length - 1];
    const yearMax = NUMERIC_YEARS[0];

    return (
        <div className="coursePage">
            <div className="courseHeader">
                <button className="backBtn" onClick={() => navigate(-1)}>← Back</button>
                <h1 className="courseTitle">
                    {course ? `${course.courseCode} — ${course.courseName}` : "Loading..."}
                </h1>
                <button className="leaveBtn" onClick={() => setShowLeaveModal(true)}>
                    Leave Course
                </button>
            </div>

            <div className="courseToolbar">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    style={{ display: "none" }}
                    onChange={handleFileChange}
                />
                <button className="toolbarBtn--upload" onClick={() => fileInputRef.current.click()}>
                    + Upload PDF
                </button>
                <button className="toolbarBtn--library" onClick={handleOpenLibraryModal}>
                    + Add from Library
                </button>

                <div className="courseSearch">
                    <input
                        className="courseSearchInput"
                        placeholder="Search titles and descriptions…"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                    />
                </div>

                {/* Filter button */}
                <div className="filterWrap" ref={filterPanelRef}>
                    <button
                        type="button"
                        className={`toolbarBtn--filter ${activeFilterCount > 0 ? "toolbarBtn--filterActive" : ""}`}
                        onClick={() => setShowFilterPanel(p => !p)}
                        aria-haspopup="true"
                        aria-expanded={showFilterPanel}
                        title="Filter"
                    >
                        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                            <path d="M1 3h13M3 7h9M5.5 11h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                        </svg>
                        {activeFilterCount > 0 && (
                            <span className="filterBadge">{activeFilterCount}</span>
                        )}
                    </button>

                    {showFilterPanel && (
                        <div className="filterPanel" role="dialog" aria-label="Filter options">
                            <div className="filterPanelHeader">
                                <span className="filterPanelTitle">Filter</span>
                                {activeFilterCount > 0 && (
                                    <button className="filterClearBtn" onClick={clearFilters}>Clear all</button>
                                )}
                            </div>

                            <div className="filterSection">
                                <div className="filterSectionLabel">Type</div>
                                <div className="filterChips">
                                    {ITEM_TYPES.map(type => (
                                        <button
                                            key={type}
                                            className={`filterChip ${filterTypes.has(type) ? "filterChipActive" : ""}`}
                                            onClick={() => toggleSet(setFilterTypes, type)}
                                        >
                                            {type === "FLASHCARD_SET" ? "Flashcards" : type === "PRACTICE_TEST" ? "Practice Test" : type}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="filterSection">
                                <div className="filterSectionLabel">Semester</div>
                                <div className="filterChips">
                                    {SEMESTERS.map(sem => (
                                        <button
                                            key={sem}
                                            className={`filterChip ${filterSemesters.has(sem) ? "filterChipActive" : ""}`}
                                            onClick={() => toggleSet(setFilterSemesters, sem)}
                                        >
                                            {sem}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="filterSection">
                                <div className="filterSectionLabel">Year</div>
                                <div className="yearRangeRow">
                                    <span className="yearRangeLabel">{filterYearMin}</span>
                                    <div className="yearRangeSliders">
                                        <input
                                            type="range"
                                            className="yearSlider"
                                            min={yearMin}
                                            max={yearMax}
                                            value={filterYearMin}
                                            onChange={e => {
                                                const v = parseInt(e.target.value, 10);
                                                setFilterYearMin(Math.min(v, filterYearMax));
                                            }}
                                        />
                                        <input
                                            type="range"
                                            className="yearSlider"
                                            min={yearMin}
                                            max={yearMax}
                                            value={filterYearMax}
                                            onChange={e => {
                                                const v = parseInt(e.target.value, 10);
                                                setFilterYearMax(Math.max(v, filterYearMin));
                                            }}
                                        />
                                    </div>
                                    <span className="yearRangeLabel">{filterYearMax}</span>
                                </div>
                                <label className="filterCheckLabel">
                                    <input
                                        type="checkbox"
                                        checked={filterIncludeUnknownYear}
                                        onChange={e => setFilterIncludeUnknownYear(e.target.checked)}
                                    />
                                    Include unknown year
                                </label>
                            </div>
                        </div>
                    )}
                </div>

                <div className="sortWrap" ref={sortMenuRef}>
                    <button
                        type="button"
                        className="toolbarBtn--sort"
                        onClick={() => setShowSortMenu(p => !p)}
                        aria-haspopup="true"
                        aria-expanded={showSortMenu}
                    >
                        ⇅ {SORT_LABELS[sortBy]}
                    </button>
                    {showSortMenu && (
                        <div className="dropdownMenu" role="menu">
                            {Object.entries(SORT_LABELS).map(([key, label]) => (
                                <button
                                    key={key}
                                    className={`menuItem ${sortBy === key ? "menuItemActive" : ""}`}
                                    onClick={() => { setSortBy(key); setShowSortMenu(false); }}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {error && <div className="courseError">{error}</div>}

            <div className="courseBody">
                {itemsLoading ? (
                    <div className="emptyState">Loading course materials…</div>
                ) : itemsError ? (
                    <div className="courseError">{itemsError}</div>
                ) : filteredItems.length === 0 ? (
                    <div className="emptyState">
                        {query || activeFilterCount > 0
                            ? "No items match your search or filters."
                            : "No content yet. Help out classmates by sharing your materials!"}
                    </div>
                ) : (
                    <div className="courseItemsGrid">
                        {filteredItems.map(cli => {
                            const isOwner = cli.libraryItem?.ownerId === userId;
                            const isMenuOpen = openMenuId === cli.id;
                            return (
                                <div
                                    key={cli.id}
                                    className={`itemCard ${isOwner ? "itemCard--mine" : ""}`}
                                    onClick={() => {
                                        if (cli.libraryItem?.itemType === "PDF") openPDF(cli.libraryItem.id);
                                    }}
                                >
                                    {/* Owner icon — visible on hover */}
                                    {isOwner && (
                                        <div className="ownerBadge" title="Added by you">
                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/>
                                                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                            </svg>
                                        </div>
                                    )}

                                    {/* Three-dot menu for owner */}
                                    {isOwner && (
                                        <div className="cardMenuWrap" onClick={e => e.stopPropagation()}>
                                            <button
                                                className="cardMenuBtn"
                                                title="Options"
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    setOpenMenuId(prev => prev === cli.id ? null : cli.id);
                                                }}
                                            >
                                                ···
                                            </button>
                                            {isMenuOpen && (
                                                <div className="cardMenu">
                                                    <button className="cardMenuItem" onClick={e => handleOpenEdit(e, cli)}>
                                                        Edit
                                                    </button>
                                                    <button
                                                        className="cardMenuItem cardMenuItem--danger"
                                                        onClick={e => {
                                                            e.stopPropagation();
                                                            setOpenMenuId(null);
                                                            setDeletingItem(cli);
                                                        }}
                                                    >
                                                        Remove from course
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="folderName">
                                        <Highlighted text={cli.libraryItem?.title ?? "Untitled"} query={query.trim()} />
                                    </div>
                                    <div className="folderMeta">
                                        <span className="itemTypeBadge">{cli.libraryItem?.itemType ?? "PDF"}</span>
                                        <div className="cliMeta">
                                            {cli.semester && cli.semester !== "Unknown" && (
                                                <span className="cliTag">{cli.semester}</span>
                                            )}
                                            {cli.year && cli.year !== "Unknown" && (
                                                <span className="cliTag">{cli.year}</span>
                                            )}
                                            {cli.libraryItem?.itemType === "PDF" && (
                                                <button
                                                    className="downloadBtn"
                                                    title="Download PDF"
                                                    onClick={e => {
                                                        e.stopPropagation();
                                                        downloadPDF(cli.libraryItem.id, cli.libraryItem.title);
                                                    }}
                                                >
                                                    ⭳
                                                </button>
                        {filteredItems.map(cli => (
                            <div
                                key={cli.id}
                                className="itemCard"
                                onClick={() => {
                                    if (cli.libraryItem?.itemType === "PDF") {
                                        openPDF(cli.libraryItem.id);
                                    } else if (cli.libraryItem?.itemType === "FLASHCARD_SET") {
                                        navigate(`/sets/${cli.libraryItem.id}`);
                                    }
                                }}
                            >
                                <div className="folderName">
                                    <Highlighted text={cli.libraryItem?.title ?? "Untitled"} query={query.trim()} />
                                </div>
                                <div className="folderMeta">
                                    <span className="itemTypeBadge">{cli.libraryItem?.itemType ?? "PDF"}</span>
                                    <div className="cliMeta">
                                        {cli.semester && cli.semester !== "Unknown" && (
                                            <span className="cliTag">{cli.semester}</span>
                                        )}
                                        {cli.year && cli.year !== "Unknown" && (
                                            <span className="cliTag">{cli.year}</span>
                                        )}
                                        {cli.libraryItem?.itemType === "PDF" && (
                                            <button
                                                className="downloadBtn"
                                                title="Download PDF"
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    downloadPDF(cli.libraryItem.id, cli.libraryItem.title);
                                                }}
                                            >
                                                ⭳
                                            </button>
                                            )}
                                        </div>
                                    </div>
                                    {cli.description && (
                                        <div className="cliDescription">
                                            <Highlighted text={cli.description} query={query.trim()} />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Study Groups section */}
            <div className="studyGroupsSection">
                <div className="studyGroupsSectionHeader">
                    <h2 className="studyGroupsSectionTitle">Study Groups</h2>
                    <button
                        className="viewAllGroupsBtn"
                        onClick={() => navigate(`/courses/${courseId}/groups`)}
                    >
                        View All →
                    </button>
                </div>
                {groupsLoading ? (
                    <p className="studyGroupsEmpty">Loading groups…</p>
                ) : groups.length === 0 ? (
                    <p className="studyGroupsEmpty">
                        No study groups yet.{" "}
                        <button className="studyGroupsInlineLink" onClick={() => navigate(`/courses/${courseId}/groups`)}>
                            Create one
                        </button>
                    </p>
                ) : (
                    <div className="studyGroupsRow">
                        {groups.slice(0, 4).map(g => (
                            <div
                                key={g.id}
                                className="studyGroupCard"
                                onClick={() => navigate(`/groups/${g.id}`)}
                            >
                                <div className="studyGroupCardName">{g.name}</div>
                                {g.description && (
                                    <div className="studyGroupCardDesc">{g.description}</div>
                                )}
                                <span className={`studyGroupPrivacyBadge studyGroupPrivacyBadge--${g.privacy?.toLowerCase()}`}>
                                    {g.privacy}
                                </span>
                            </div>
                        ))}
                        {groups.length > 4 && (
                            <div
                                className="studyGroupCard studyGroupCard--more"
                                onClick={() => navigate(`/courses/${courseId}/groups`)}
                            >
                                +{groups.length - 4} more
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* PDF metadata modal */}
            {showPDFModal && (
                <div className="modalOverlay" onClick={() => setShowPDFModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modalTitle">Save PDF to Course</div>
                        <div className="pdfForm">
                            <label className="pdfLabel">
                                Name
                                <input
                                    className="pdfInput"
                                    type="text"
                                    value={pdfTitle}
                                    onChange={e => setPdfTitle(e.target.value)}
                                />
                            </label>
                            <label className="pdfLabel">
                                Year
                                <select className="pdfSelect" value={pdfYear} onChange={e => setPdfYear(e.target.value)}>
                                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </label>
                            <label className="pdfLabel">
                                Semester
                                <select className="pdfSelect" value={pdfSemester} onChange={e => setPdfSemester(e.target.value)}>
                                    {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </label>
                            <label className="pdfLabel">
                                Description
                                <textarea
                                    className="pdfTextarea"
                                    value={pdfDescription}
                                    onChange={e => setPdfDescription(e.target.value.slice(0, 255))}
                                    placeholder="Add additional information here; e.g. professor(s), contains answers, etc."
                                    rows={3}
                                    maxLength={255}
                                />
                            </label>
                            <p className="pdfWarning">
                                ⚠️ Ensure that you have uploaded the correct file and that all information is correct!
                            </p>
                        </div>
                        <div className="modalActions">
                            <button className="btn cancelBtn" onClick={() => setShowPDFModal(false)}>
                                Cancel
                            </button>
                            <button className="btn primary" onClick={handlePDFConfirm} disabled={uploading || !pdfTitle.trim()}>
                                {uploading ? "Saving..." : "Save to Course"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Leave course modal */}
            {showLeaveModal && (
                <div className="modalOverlay" onClick={() => setShowLeaveModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modalTitle">Leave this course?</div>
                        <p className="modalBody">
                            Are you sure you want to leave <strong>{course?.courseCode} — {course?.courseName}</strong>?
                            You can always re-enroll later.
                        </p>
                        <div className="modalActions">
                            <button className="btn cancelBtn" onClick={() => setShowLeaveModal(false)}>
                                Cancel
                            </button>
                            <button className="btn leaveConfirmBtn" onClick={handleLeave} disabled={leaving}>
                                {leaving ? "Leaving..." : "Yes, leave"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Library picker modal */}
            {showLibraryModal && (
                <div className="modalOverlay" onClick={() => setShowLibraryModal(false)}>
                    <div className="modal modalLarge" onClick={e => e.stopPropagation()}>
                        <div className="modalTitle">Add from Library</div>
                        <input
                            className="librarySearchInput"
                            placeholder="Search your library…"
                            value={librarySearch}
                            onChange={e => setLibrarySearch(e.target.value)}
                        />
                        {libraryLoading ? (
                            <div className="emptyState">Loading your library…</div>
                        ) : libraryError ? (
                            <div className="courseError">{libraryError}</div>
                        ) : filteredLibraryItems.length === 0 ? (
                            <div className="emptyState">No library items found.</div>
                        ) : (
                            <div className="libraryPickerList">
                                {filteredLibraryItems.map(li => {
                                    const alreadyAdded = addedLibraryItemIds.has(li.id);
                                    const isSelected = selectedLibraryItem?.id === li.id;
                                    return (
                                        <div
                                            key={li.id}
                                            className={`libraryPickerItem ${isSelected ? "libraryPickerItem--selected" : ""} ${alreadyAdded ? "libraryPickerItem--disabled" : ""}`}
                                            onClick={() => {
                                                if (alreadyAdded) return;
                                                setSelectedLibraryItem(prev => prev?.id === li.id ? null : li);
                                            }}
                                        >
                                            <div className="libraryPickerItemTitle">
                                                <Highlighted text={li.title ?? "Untitled"} query={librarySearch.trim()} />
                                                {alreadyAdded && <span className="alreadyAddedBadge">Already added</span>}
                                            </div>
                                            <div className="libraryPickerItemMeta">
                                                <span className="itemTypeBadge">{li.itemType ?? "PDF"}</span>
                                                {li.description && (
                                                    <span className="libraryPickerItemDesc">
                                                        <Highlighted text={li.description} query={librarySearch.trim()} />
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        <div className="modalActions">
                            <button className="btn cancelBtn" onClick={() => setShowLibraryModal(false)}>
                                Cancel
                            </button>
                            <button className="btn primary" onClick={handleLibraryNext} disabled={!selectedLibraryItem}>
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Library item metadata modal */}
            {showLibMetaModal && (
                <div className="modalOverlay" onClick={() => setShowLibMetaModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modalTitle">Add to Course</div>
                        <div className="pdfForm">
                            <label className="pdfLabel">
                                Year
                                <select className="pdfSelect" value={libMetaYear} onChange={e => setLibMetaYear(e.target.value)}>
                                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </label>
                            <label className="pdfLabel">
                                Semester
                                <select className="pdfSelect" value={libMetaSemester} onChange={e => setLibMetaSemester(e.target.value)}>
                                    {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </label>
                            <label className="pdfLabel">
                                Description
                                <textarea
                                    className="pdfTextarea"
                                    value={libMetaDescription}
                                    onChange={e => setLibMetaDescription(e.target.value.slice(0, 255))}
                                    placeholder="Add additional information here, e.g. professor(s)"
                                    rows={3}
                                    maxLength={255}
                                />
                            </label>
                            <p className="pdfWarning">
                                ⚠️ Ensure that you have uploaded the correct file and that all information is correct!
                            </p>
                        </div>
                        <div className="modalActions">
                            <button className="btn cancelBtn" onClick={handleLibMetaBack}>
                                ← Back
                            </button>
                            <button className="btn primary" onClick={handleLibMetaConfirm} disabled={libMetaAdding}>
                                {libMetaAdding ? "Adding..." : "Add to Course"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit modal */}
            {editingItem && (
                <div className="modalOverlay" onClick={() => setEditingItem(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modalTitle">Edit Details</div>
                        <div className="pdfForm">
                            <label className="pdfLabel">
                                Year
                                <select className="pdfSelect" value={editYear} onChange={e => setEditYear(e.target.value)}>
                                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </label>
                            <label className="pdfLabel">
                                Semester
                                <select className="pdfSelect" value={editSemester} onChange={e => setEditSemester(e.target.value)}>
                                    {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </label>
                            <label className="pdfLabel">
                                Description
                                <textarea
                                    className="pdfTextarea"
                                    value={editDescription}
                                    onChange={e => setEditDescription(e.target.value.slice(0, 255))}
                                    placeholder="Add additional information here, e.g. professor(s)"
                                    rows={3}
                                    maxLength={255}
                                />
                            </label>
                        </div>
                        <div className="modalActions">
                            <button className="btn cancelBtn" onClick={() => setEditingItem(null)}>Cancel</button>
                            <button className="btn primary" onClick={handleEditSave} disabled={editSaving}>
                                {editSaving ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete confirmation modal */}
            {deletingItem && (
                <div className="modalOverlay" onClick={() => setDeletingItem(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modalTitle">Remove from course?</div>
                        <p className="modalBody">
                            <strong>{deletingItem.libraryItem?.title ?? "This item"}</strong> will be removed from the course but will remain in your library.
                        </p>
                        <div className="modalActions">
                            <button className="btn cancelBtn" onClick={() => setDeletingItem(null)}>Cancel</button>
                            <button className="btn leaveConfirmBtn" onClick={handleDeleteConfirm} disabled={deleteConfirming}>
                                {deleteConfirming ? "Removing..." : "Remove"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CoursePage;