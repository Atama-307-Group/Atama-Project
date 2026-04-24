import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getCourse, unenrollFromCourse, uploadPDFToCourse, getCourseItems, openPDF, downloadPDF,
    addLibraryItemToCourse, updateCourseLibraryItem, deleteCourseLibraryItem, getGroupsByCourse } from "../api.js";
import "./CoursePage.css";

import Highlighted from "../components/Highlighted.jsx";
import CourseToolbar from "../components/CourseToolbar";
import MetadataModal from "../components/MetadataModal";
import { NUMERIC_YEARS, YEARS, SEMESTERS } from "../constants.js";

import useEscapeKey from "../hooks/useEscapeKey.js"
import useCourseItems from "../hooks/useCourseItems";
import useFilteredItems from "../hooks/useFilteredItems";


const CoursePage = ({ userId }) => {
    const navigate = useNavigate();
    const { courseId } = useParams();
    const [course, setCourse] = useState(null);
    const [showLeaveModal, setShowLeaveModal] = useState(false);
    const [leaving, setLeaving] = useState(false);

    // Sorting
    const [sortBy, setSortBy] = useState("alpha-asc");
    const [showSortMenu, setShowSortMenu] = useState(false);

    // Search
    const [query, setQuery] = useState("");

    // Filters
    const [showFilterPanel, setShowFilterPanel] = useState(false);
    const [filterTypes, setFilterTypes] = useState(new Set());
    const [filterSemesters, setFilterSemesters] = useState(new Set());
    const [filterYearMin, setFilterYearMin] = useState(NUMERIC_YEARS[NUMERIC_YEARS.length - 1]);
    const [filterYearMax, setFilterYearMax] = useState(NUMERIC_YEARS[0]);
    const [filterIncludeUnknownYear, setFilterIncludeUnknownYear] = useState(true);

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
    const [editTitle, setEditTitle] = useState("");

    useEffect(() => {
        if (!courseId) return;
        getCourse(courseId).then(setCourse).catch(console.error);
    }, [courseId]);

    const { items, setItems, loading: itemsLoading, error: itemsError } = useCourseItems(courseId);

    useEffect(() => {
        if (!courseId) return;
        getGroupsByCourse(courseId)
            .then(data => setGroups(Array.isArray(data) ? data : []))
            .catch(() => setGroups([]))
            .finally(() => setGroupsLoading(false));
    }, [courseId]);

    const filteredItems = useFilteredItems(items, query, sortBy, {
        filterTypes,
        filterSemesters,
        filterYearMin,
        filterYearMax,
        filterIncludeUnknownYear,
    });

    const handleEscape = useCallback(() => {
        setShowPDFModal(false);
        setShowLeaveModal(false);
        setShowSortMenu(false);
        setShowFilterPanel(false);
        setShowLibraryModal(false);
        setShowLibMetaModal(false);
        setOpenMenuId(null);
        setEditingItem(null);
        setDeletingItem(null);
    }, []);

    useEscapeKey(handleEscape);

    useEffect(() => {
        if (!openMenuId) return;
        function handlePointerDown(e) {
            if (e.target.closest(".cardMenuWrap")) return;
            setOpenMenuId(null);
        }
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
        setEditTitle(cli.libraryItem?.title ?? "");
    }

    async function handleEditSave() {
        if (!editingItem) return;
        setEditSaving(true);
        try {
            const promises = [
                updateCourseLibraryItem(editingItem.id, editYear, editSemester, editDescription || null)
            ];

            const titleChanged = editTitle !== editingItem.libraryItem?.title;
            const canEditTitle = editingItem.libraryItem?.itemType !== "FLASHCARD";
            if (canEditTitle && titleChanged) {
                promises.push(updateLibraryItem(editingItem.libraryItem.id, { title: editTitle }));
            }

            const [updated] = await Promise.all(promises);

            setItems(prev => prev.map(i => i.id === updated.id ? {
                ...updated,
                libraryItem: { ...updated.libraryItem, title: editTitle }
            } : i));
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

            <CourseToolbar
                query={query}
                onQueryChange={setQuery}
                sortBy={sortBy}
                onSortChange={setSortBy}
                showSortMenu={showSortMenu}
                onToggleSortMenu={setShowSortMenu}
                showFilterPanel={showFilterPanel}
                onToggleFilterPanel={setShowFilterPanel}
                activeFilterCount={activeFilterCount}
                filterTypes={filterTypes}
                filterSemesters={filterSemesters}
                filterYearMin={filterYearMin}
                filterYearMax={filterYearMax}
                filterIncludeUnknownYear={filterIncludeUnknownYear}
                onToggleFilterType={v => toggleSet(setFilterTypes, v)}
                onToggleFilterSemester={v => toggleSet(setFilterSemesters, v)}
                onFilterYearMinChange={v => setFilterYearMin(Math.min(v, filterYearMax))}
                onFilterYearMaxChange={v => setFilterYearMax(Math.max(v, filterYearMin))}
                onFilterIncludeUnknownYearChange={setFilterIncludeUnknownYear}
                onClearFilters={clearFilters}
                onUploadClick={() => fileInputRef.current.click()}
                onAddFromLibrary={handleOpenLibraryModal}
                fileInputRef={fileInputRef}
                onFileChange={handleFileChange}
            />

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
                                        if (cli.libraryItem?.itemType === "PDF") {
                                            openPDF(cli.libraryItem.id);
                                        } else if (cli.libraryItem?.itemType === "FLASHCARD_SET") {
                                            navigate(`/sets/${cli.libraryItem.id}`);
                                        }
                                    }}
                                >
                                    {/* Owner badge — visible on hover */}
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
                <MetadataModal
                    title="Save PDF to Course"
                    year={pdfYear}
                    setYear={setPdfYear}
                    semester={pdfSemester}
                    setSemester={setPdfSemester}
                    description={pdfDescription}
                    setDescription={setPdfDescription}
                    onCancel={() => setShowPDFModal(false)}
                    onConfirm={handlePDFConfirm}
                    confirmText="Save to Course"
                    loading={uploading}
                />
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
                <MetadataModal
                    title="Add to Course"
                    year={libMetaYear}
                    setYear={setLibMetaYear}
                    semester={libMetaSemester}
                    setSemester={setLibMetaSemester}
                    description={libMetaDescription}
                    setDescription={setLibMetaDescription}
                    onCancel={() => setShowLibMetaModal(false)}
                    onConfirm={handleLibMetaConfirm}
                    onBack={handleLibMetaBack}
                    confirmText="Add to Course"
                    loading={libMetaAdding}
                />
            )}

            {/* Edit modal */}
            {editingItem && (
                <MetadataModal
                    title="Edit Details"
                    year={editYear}
                    setYear={setEditYear}
                    semester={editSemester}
                    setSemester={setEditSemester}
                    description={editDescription}
                    setDescription={setEditDescription}
                    onCancel={() => setEditingItem(null)}
                    onConfirm={handleEditSave}
                    confirmText="Save Changes"
                    loading={editSaving}
                    allowTitleEdit={editingItem?.libraryItem?.itemType !== "FLASHCARD"}
                    itemTitle={editTitle}
                    setItemTitle={setEditTitle}
                />
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