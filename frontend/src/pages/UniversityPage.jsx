import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUniversity, getCourses, getEnrolledCourses, enrollInCourse, unenrollFromCourse } from "../api.js";
import "./UniversityPage.css";

const UniversityPage = ({ userId }) => {
    const navigate = useNavigate();
    const [university, setUniversity] = useState(null);
    const [courses, setCourses] = useState([]);
    const [enrolledIds, setEnrolledIds] = useState(new Set());
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [enrolling, setEnrolling] = useState(false);
    const [view, setView] = useState(() => localStorage.getItem("universityView") || "all");
    const [showLeaveAllModal, setShowLeaveAllModal] = useState(false);
    const [leavingAll, setLeavingAll] = useState(false);


    useEffect(() => {
        if (!userId) return;
        getUniversity(userId)
            .then(uni => {
                setUniversity(uni);
                return Promise.all([getCourses(uni.id), getEnrolledCourses(userId)]);
            })
            .then(([allCourses, enrolled]) => {
                setCourses(allCourses);
                setEnrolledIds(new Set(enrolled.map(c => c.id)));
            })
            .catch(console.error);
    }, [userId]);

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

    async function handleLeaveAll() {
        setLeavingAll(true);
        try {
            await Promise.all([...enrolledIds].map(courseId => unenrollFromCourse(userId, courseId)));
            setEnrolledIds(new Set());
            setShowLeaveAllModal(false);
        } catch (err) {
            console.error(err);
        } finally {
            setLeavingAll(false);
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
                {enrolledIds.size > 0 && (
                    <button className="leaveAllBtn" onClick={() => setShowLeaveAllModal(true)}>
                        Leave All Courses
                    </button>
                )}
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
                                    {enrolled && <div className="enrolledBadge">✓ Enrolled</div>}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {selectedCourse && (
                <div className="modalOverlay" onClick={() => setSelectedCourse(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modalTitle">Enroll in course?</div>
                        <p className="modalBody">
                            Do you want to enroll in <strong>{selectedCourse.courseCode} — {selectedCourse.courseName}</strong>?
                        </p>
                        <div className="modalActions">
                            <button className="btn cancelBtn" onClick={() => setSelectedCourse(null)}>
                                Cancel
                            </button>
                            <button className="btn primary" onClick={handleEnroll} disabled={enrolling}>
                                {enrolling ? "Enrolling..." : "Yes, enroll"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showLeaveAllModal && (
                <div className="modalOverlay" onClick={() => setShowLeaveAllModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modalTitle">Leave all courses?</div>
                        <p className="modalBody">
                            Are you sure you want to leave all your enrolled courses? You can always re-enroll later.
                        </p>
                        <div className="modalActions">
                            <button className="btn cancelBtn" onClick={() => setShowLeaveAllModal(false)}>
                                Cancel
                            </button>
                            <button className="btn leaveAllConfirmBtn" onClick={handleLeaveAll} disabled={leavingAll}>
                                {leavingAll ? "Leaving..." : "Yes, leave all"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UniversityPage;