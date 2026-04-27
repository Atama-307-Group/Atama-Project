import { } from "react";

const EnrollModal = ({ course, enrolling, onConfirm, onCancel }) => {
    if (!course) return null;

    return (
        <div className="modalOverlay" onClick={onCancel}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modalTitle">Enroll in course?</div>
                <p className="modalBody">
                    Do you want to enroll in <strong>{course.courseCode} — {course.courseName}</strong>?
                    This will give you access to the course page and resources.
                </p>
                <div className="modalActions">
                    <button className="btn cancelBtn" onClick={onCancel}>
                        Cancel
                    </button>
                    <button className="btn primary" onClick={onConfirm} disabled={enrolling}>
                        {enrolling ? "Enrolling..." : "Yes, enroll"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EnrollModal;