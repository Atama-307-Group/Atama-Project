import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getCourse, unenrollFromCourse } from "../api.js";
import "./CoursePage.css";

const CoursePage = ({ userId }) => {
    const navigate = useNavigate();
    const { courseId } = useParams();
    const [course, setCourse] = useState(null);
    const [showLeaveModal, setShowLeaveModal] = useState(false);
    const [leaving, setLeaving] = useState(false);

    useEffect(() => {
        if (!courseId) return;
        getCourse(courseId)
            .then(setCourse)
            .catch(console.error);
    }, [courseId]);

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

            <div className="courseBody">
                <div className="emptyState">No content yet.</div>
            </div>

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