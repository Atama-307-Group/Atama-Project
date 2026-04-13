import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getUniversity, getCourses, getEnrolledCourses, enrollInCourse, unenrollFromAllCourses, unenrollFromCourse } from "../api.js";
import "./UniversityPage.css";
import EnrollModal from "../components/EnrollModal.jsx"
import LeaveAllCoursesModal from "../components/LeaveAllCoursesModal.jsx"

const UniversityPage = ({ userId }) => {
    const navigate = useNavigate();
    const [university, setUniversity] = useState(null);
    const [courses, setCourses] = useState([]);
    const [enrolledIds, setEnrolledIds] = useState(new Set());
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [enrolling, setEnrolling] = useState(false);
    const [view, setView] = useState(() => localStorage.getItem("universityView") || "all");
    const [showLeaveAllCoursesModal, setShowLeaveAllCoursesModal] = useState(false);
    const [leavingAll, setLeavingAll] = useState(false);
    const [openMenuId, setOpenMenuId] = useState(null);
    const [leaveOneCourse, setLeaveOneCourse] = useState(null);
    const [leavingOne, setLeavingOne] = useState(false);
    const [scheduledLeaveDate, setScheduledLeaveDate] = useState(null);

    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeIndex, setActiveIndex] = useState(0);
    const menuRef = useRef(null);
    const searchInputRef = useRef(null);


    useEffect(() => {
        getUniversity()
            .then(uni => {
                console.log("uni:", uni);
                setUniversity(uni);
                return Promise.all([getCourses(uni.id), getEnrolledCourses(userId)]);
            })
            .then(([allCourses, enrolled]) => {
                        console.log("courses:", allCourses); // check this isn't empty
                        console.log("enrolled:", enrolled);
                setCourses(allCourses);
                setEnrolledIds(new Set(enrolled.map(c => c.id)));
            })
            .catch(console.error);
    }, [userId]);

    // Global keyboard shortcut: Cmd/Ctrl+K to open search
    useEffect(() => {
        function onKeyDown(e) {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                setSearchOpen(true);
            }
            if (e.key === "Escape") {
                if (searchOpen) {
                    setSearchOpen(false);
                    setSearchQuery("");
                } else if (showLeaveAllCoursesModal) {
                    setShowLeaveAllCoursesModal(false);
                }
            }
        }
        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, [searchOpen, showLeaveAllCoursesModal]);

    // Focus input when overlay opens
    useEffect(() => {
        if (searchOpen) {
            setTimeout(() => searchInputRef.current?.focus(), 50);
            setActiveIndex(0);
        } else {
            setSearchQuery("");
        }
    }, [searchOpen]);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(e) {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setOpenMenuId(null);
            }
        }
        if (openMenuId !== null) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [openMenuId]);

    // Filtered search results
    const searchResults = searchQuery.trim().length === 0 ? [] : courses.filter(c => {
        const q = searchQuery.toLowerCase();
        return (
            c.courseCode.toLowerCase().includes(q) ||
            c.courseName.toLowerCase().includes(q)
        );
    }).slice(0, 8);

    useEffect(() => { setActiveIndex(0); }, [searchQuery]);

    function handleSearchKeyDown(e) {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIndex(i => Math.min(i + 1, searchResults.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex(i => Math.max(i - 1, 0));
        } else if (e.key === "Enter") {
            if (searchResults[activeIndex]) handleSearchSelect(searchResults[activeIndex]);
        }
    }

    function handleSearchSelect(course) {
        setSearchOpen(false);
        setSearchQuery("");
        if (enrolledIds.has(course.id)) {
            navigate(`/course/${course.id}`);
        } else {
            setSelectedCourse(course);
        }
    }

    function highlightMatch(text, query) {
        if (!query.trim()) return text;
        const idx = text.toLowerCase().indexOf(query.toLowerCase());
        if (idx === -1) return text;
        return (
            <>
                {text.slice(0, idx)}
                <mark className="searchHighlight">{text.slice(idx, idx + query.length)}</mark>
                {text.slice(idx + query.length)}
            </>
        );
    }

    async function handleEnroll() {
        if (!selectedCourse) return;
        setEnrolling(true);
        try {
            await enrollInCourse(userId, selectedCourse.id);
            setEnrolledIds(prev => new Set([...prev, selectedCourse.id]));
            setSelectedCourse(null);
        } catch (err) {
            console.error(err);
        } finally {
            setEnrolling(false);
        }
    }

    async function handleLeaveAll(scheduleDate) {
        setLeavingAll(true);
        try {
            if (scheduleDate) {
                await fetch(`/api/users/${userId}/schedule-leave`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ scheduledFor: scheduleDate.toISOString() })
                });
                setScheduledLeaveDate(scheduleDate);
            } else {
                await Promise.all([...enrolledIds].map(courseId => unenrollFromAllCourses(userId, courseId)));
                setEnrolledIds(new Set());
                setScheduledLeaveDate(null);
            }
            setShowLeaveAllCoursesModal(false);
        } catch (err) {
            console.error(err);
        } finally {
            setLeavingAll(false);
        }
    }

    async function handleLeaveOne() {
        if (!leaveOneCourse) return;
        setLeavingOne(true);
        try {
            await unenrollFromCourse(userId, leaveOneCourse.id);
            setEnrolledIds(prev => {
                const next = new Set(prev);
                next.delete(leaveOneCourse.id);
                return next;
            });
            setLeaveOneCourse(null);
        } catch (err) {
            console.error(err);
        } finally {
            setLeavingOne(false);
        }
    }

    const visibleCourses = view === "enrolled"
        ? courses.filter(c => enrolledIds.has(c.id))
        : courses;

    function handleSetView(v) {
        setView(v);
        localStorage.setItem("universityView", v);
    }

    return (
        <div className="universityPage">
            <div className="universityHeader">
                <button className="backBtn" onClick={() => navigate('/')}>← Back</button>
                <h1 className="universityTitle">{university ? university.name : "Loading..."}</h1>
                {enrolledIds.size > 0 && (
                    <button className="leaveAllBtn" onClick={() => setShowLeaveAllCoursesModal(true)}>
                        Leave All Your Courses
                    </button>
                )}
            </div>

            <div className="viewToggle">
                <button
                    className={`toggleBtn ${view === "all" ? "toggleBtn--active" : ""}`}
                    onClick={() => handleSetView("all")}
                >
                    All Courses
                </button>
                <button
                    className={`toggleBtn ${view === "enrolled" ? "toggleBtn--active" : ""}`}
                    onClick={() => handleSetView("enrolled")}
                >
                    Your Enrolled Courses
                </button>
                <button className="searchTriggerBtn" onClick={() => setSearchOpen(true)} aria-label="Search courses">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <span className="searchTriggerLabel">Search courses</span>
                    <kbd className="searchKbd">⌘K</kbd>
                </button>
            </div>

            <div className="coursesBody">
                {visibleCourses.length === 0 ? (
                    <div className="emptyState">
                        {view === "enrolled" ? "You haven't enrolled in any courses yet." : "No courses found."}
                    </div>
                ) : (
                    <div className="courseGrid">
                        {visibleCourses.map(course => {
                            const enrolled = enrolledIds.has(course.id);
                            return (
                                <div
                                    key={course.id}
                                    className={`courseCard ${enrolled ? "courseCard--enrolled" : ""}`}
                                    onClick={() => enrolled ? navigate(`/course/${course.id}`) : setSelectedCourse(course)}
                                >
                                    <div className="courseCode">{course.courseCode}</div>
                                    <div className="courseName">{course.courseName}</div>

                                    {enrolled && (
                                        <div className="enrolledRow">
                                            <div className="enrolledBadge">✓ Enrolled</div>
                                            <div
                                                className="courseMenuWrapper"
                                                ref={openMenuId === course.id ? menuRef : null}
                                            >
                                                <button
                                                    className="courseMenuButton"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setOpenMenuId(prev => prev === course.id ? null : course.id);
                                                    }}
                                                    aria-label="Course options"
                                                >
                                                    ⋯
                                                </button>
                                                {openMenuId === course.id && (
                                                    <div
                                                        className="courseDropdown"
                                                        onClick={e => e.stopPropagation()}
                                                    >
                                                        <button
                                                            className="courseDropdownItem courseDropdownItem--danger"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setLeaveOneCourse(course);
                                                                setOpenMenuId(null);
                                                            }}
                                                        >
                                                            Leave course
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Search overlay */}
            {searchOpen && (
                <div className="searchOverlay" onClick={() => { setSearchOpen(false); setSearchQuery(""); }}>
                    <div className="searchPanel" onClick={e => e.stopPropagation()}>
                        <div className="searchInputRow">
                            <svg className="searchIcon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                            <input
                                ref={searchInputRef}
                                className="searchInput"
                                placeholder="Search by course code or name…"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                onKeyDown={handleSearchKeyDown}
                                autoComplete="off"
                                spellCheck="false"
                            />
                            <kbd className="searchEscKbd" onClick={() => { setSearchOpen(false); setSearchQuery(""); }}>esc</kbd>
                        </div>
                        <div className="searchResults">
                            {searchQuery.trim().length === 0 ? (
                                <div className="searchEmpty">Start typing to search from {courses.length} courses…</div>
                            ) : searchResults.length === 0 ? (
                                <div className="searchEmpty">No courses match "<strong>{searchQuery}</strong>"</div>
                            ) : (
                                searchResults.map((course, i) => {
                                    const enrolled = enrolledIds.has(course.id);
                                    return (
                                        <button
                                            key={course.id}
                                            className={`searchResultItem ${i === activeIndex ? "searchResultItem--active" : ""}`}
                                            onMouseEnter={() => setActiveIndex(i)}
                                            onClick={() => handleSearchSelect(course)}
                                        >
                                            <div className="searchResultLeft">
                                                <span className="searchResultCode">
                                                    {highlightMatch(course.courseCode, searchQuery)}
                                                </span>
                                                <span className="searchResultName">
                                                    {highlightMatch(course.courseName, searchQuery)}
                                                </span>
                                            </div>
                                            <div className="searchResultRight">
                                                {enrolled
                                                    ? <span className="searchEnrolledBadge">✓ Enrolled</span>
                                                    : <span className="searchEnrollHint">Enroll →</span>
                                                }
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                        {searchResults.length > 0 && (
                            <div className="searchFooter">
                                <span>↑↓ navigate</span>
                                <span>↵ select</span>
                                <span>esc close</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Enroll modal */}
            {selectedCourse && (
                <EnrollModal
                    course={selectedCourse}
                    enrolling={enrolling}
                    onConfirm={handleEnroll}
                    onCancel={() => setSelectedCourse(null)}
                />
            )}

            {/* Leave one course modal */}
            {leaveOneCourse && (
                <div className="modalOverlay" onClick={() => setLeaveOneCourse(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modalTitle">Leave course?</div>
                        <p className="modalBody">
                            Are you sure you want to leave <strong>{leaveOneCourse.courseCode} — {leaveOneCourse.courseName}</strong>? You can always re-enroll later.
                        </p>
                        <div className="modalActions">
                            <button className="btn cancelBtn" onClick={() => setLeaveOneCourse(null)}>
                                Cancel
                            </button>
                            <button className="btn leaveAllConfirmBtn" onClick={handleLeaveOne} disabled={leavingOne}>
                                {leavingOne ? "Leaving..." : "Yes, leave"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Leave all courses modal */}
            {showLeaveAllCoursesModal && (
                <LeaveAllCoursesModal
                        leavingAll={leavingAll}
                        scheduledLeaveDate={scheduledLeaveDate}
                        onConfirm={handleLeaveAll}
                        onCancel={() => setShowLeaveAllCoursesModal(false)}
                    />
            )}
        </div>
    );
};

export default UniversityPage;