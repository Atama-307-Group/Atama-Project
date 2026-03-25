import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getCourse, unenrollFromCourse, uploadPDFToCourse, getCourseItems, openPDF, downloadPDF } from "../api.js";
import "./CoursePage.css";

const YEARS = ["Unknown", ...Array.from({ length: 10 }, (_, i) => String(new Date().getFullYear() - i))];
const SEMESTERS = ["Unknown", "Fall", "Spring", "Summer", "Winter"];

const SORT_LABELS = {
    "alpha-asc": "Alphabetical (A → Z)",
    "alpha-desc": "Alphabetical (Z → A)",
    "created-desc": "Date added (Newest)",
    "created-asc": "Date added (Oldest)",
    "accessed-desc": "Last accessed",
    "year" : "TODO by year/sem"
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

    // Close sort menu on outside click
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

    // Close modals on Escape
    useEffect(() => {
        function onKeyDown(e) {
            if (e.key === "Escape") {
                setShowPDFModal(false);
                setShowLeaveModal(false);
                setShowSortMenu(false);
            }
        }
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, []);

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
            .filter(item => (item.libraryItem?.title ?? "").toLowerCase().includes(q))
            .sort(compareBySort);
    }, [items, query, sortBy]);

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
                <button className="toolbarBtn--library" onClick={() => {}}>
                    + Add from Library
                </button>

                <div className="courseSearch">
                    <input
                        className="courseSearchInput"
                        placeholder="Search course materials…"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                    />
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
                        {query ? "No items match your search." : "No content yet. Help out classmates by sharing your materials!"}
                    </div>
                ) : (
                    <div className="courseItemsGrid">
                        {filteredItems.map(cli => (
                            <div
                                key={cli.id}
                                className="itemCard"
                                onClick={() => {
                                    if (cli.libraryItem?.itemType === "PDF") {
                                        openPDF(cli.libraryItem.id);
                                    }
                                }}
                            >
                                <div className="folderName">{cli.libraryItem?.title ?? "Untitled"}</div>
                                <div className="folderMeta">
                                    <span className="itemTypeBadge">{cli.libraryItem?.itemType ?? "PDF"}</span>
                                    <div className="cliMeta">
                                        {cli.semester && cli.semester !== "Unknown" && (
                                            <span className="cliTag">{cli.semester}</span>
                                        )}
                                        {cli.year && cli.year !== "Unknown" && (
                                            <span className="cliTag">{cli.year}</span>
                                        )}
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
                                    </div>

                                </div>
                                {cli.description && (
                                    <div className="cliDescription">{cli.description}</div>
                                )}

                            </div>
                        ))}
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
                                    placeholder="Add additional information here, e.g. professor(s)"
                                    rows={3}
                                    maxLength={255}
                                />
                            </label>
                            <p className="pdfWarning">
                                ⚠️ Ensure that you have uploaded the correct file. Ensure that all information is correct before saving.
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
        </div>
    );
};

export default CoursePage;
