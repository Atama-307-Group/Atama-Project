import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./UniversityPage.css";
import EnrollModal from "../components/EnrollModal.jsx"
import LeaveAllCoursesModal from "../components/LeaveAllCoursesModal.jsx"
import { useCourseEnrollment } from "../hooks/useCourseEnrollment.js";
import { useSearch } from "../hooks/useSearch.jsx";
import EnrollFromScheduleModal from "../components/EnrollFromScheduleModal";
import RequestCourseModal from "../components/RequestCourseModal";


const UniversityPage = ({ userId }) => {
    const {
        university, courses, enrolledIds,
        selectedCourse, setSelectedCourse,
        enrolling, handleEnroll,
        showLeaveAllModal, setShowLeaveAllModal, leavingAll, handleLeaveAll,
        leaveOneCourse, setLeaveOneCourse, leavingOne, handleLeaveOne,
        scheduledLeaveDate, setScheduledLeaveDate,
    } = useCourseEnrollment(userId);

    const {
        searchOpen, searchQuery, setSearchQuery,
        activeIndex, setActiveIndex,
        searchResults, searchInputRef,
        handleSearchKeyDown, handleSearchSelect,
        highlightMatch, closeSearch, openSearch,
    } = useSearch(courses, enrolledIds);

    const navigate = useNavigate();
    const [view, setView] = useState(() => localStorage.getItem("universityView") || "all");
    const [openMenuId, setOpenMenuId] = useState(null);

    const menuRef = useRef(null);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [showRequestModal, setShowRequestModal] = useState(false);

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
                } else if (showLeaveAllModal) {
                    setShowLeaveAllModal(false);
                }
            }
        }
        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, [searchOpen, showLeaveAllModal]);

    function handleSetView(v) {
        setView(v);
        localStorage.setItem("universityView", v);
    }

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


    useEffect(() => { setActiveIndex(0); }, [searchQuery]);


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
                    <button className="leaveAllBtn" onClick={() => setShowLeaveAllModal(true)}>
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

                {view === "enrolled" && (
                    <button className="enrollFromScheduleBtn" onClick={() => setShowScheduleModal(true)}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Enroll from Schedule
                    </button>
                )}



                <div className="searchGroup">
                    <button
                        className="requestCourseBtn"
                        onClick={() => setShowRequestModal(true)}
                        aria-label="Request a course"
                        title="Request a course to be added"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                    </button>
                    <button className="searchTriggerBtn" onClick={openSearch} aria-label="Search courses">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <span className="searchTriggerLabel">Search courses</span>
                        <kbd className="searchKbd">⌘K</kbd>
                    </button>
                </div>
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
                <div className="searchOverlay" onClick={closeSearch}>
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
                            <kbd className="searchEscKbd" onClick={closeSearch}>esc</kbd>                        </div>
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

            {/* Enroll from schedule modal */}
            {showScheduleModal && (
                <EnrollFromScheduleModal
                    onClose={() => setShowScheduleModal(false)}
                    courses={courses}
                    onEnroll={async (foundCourses) => {
                        for (const course of foundCourses) {
                            await handleEnroll(course);
                        }
                        setShowScheduleModal(false);
                    }}
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
            {showLeaveAllModal && (
                <LeaveAllCoursesModal
                        leavingAll={leavingAll}
                        scheduledLeaveDate={scheduledLeaveDate}
                        onConfirm={handleLeaveAll}
                        onCancel={() => setShowLeaveAllModal(false)}
                    />
            )}

            {/* Request course modal */}
            {showRequestModal && (
                <RequestCourseModal
                    university={university}
                    userId={userId}
                    onClose={() => setShowRequestModal(false)}
                />
            )}

        </div>
    );
};

export default UniversityPage;