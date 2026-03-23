import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getCourse, unenrollFromCourse, uploadPDF } from "../api.js";
import "./CoursePage.css";

const YEARS = ["Unknown", ...Array.from({ length: 10 }, (_, i) => String(new Date().getFullYear() - i))];
const SEMESTERS = ["Unknown", "Fall", "Spring", "Summer", "Winter"];

const CoursePage = ({ userId }) => {
    const navigate = useNavigate();
    const { courseId } = useParams();
    const [course, setCourse] = useState(null);
    const [showLeaveModal, setShowLeaveModal] = useState(false);
    const [leaving, setLeaving] = useState(false);

    const fileInputRef = useRef(null);
    const [pendingFile, setPendingFile] = useState(null);
    const [showPDFModal, setShowPDFModal] = useState(false);
    const [pdfTitle, setPdfTitle] = useState("");
    const [pdfYear, setPdfYear] = useState("Unknown");
    const [pdfSemester, setPdfSemester] = useState("Unknown");
    const [pdfDescription, setPdfDescription] = useState("");
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (!courseId) return;
        getCourse(courseId)
            .then(setCourse)
            .catch(console.error);
    }, [courseId]);

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
            await uploadPDF(pendingFile, pdfTitle, pdfYear, pdfSemester, pdfDescription || null, courseId);
            setShowPDFModal(false);
            setPendingFile(null);
        } catch (err) {
            console.error(err);
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
            </div>

            <div className="courseBody">
                <div className="emptyState">No content yet.</div>
            </div>

            {/* PDF metadata modal */}
            {showPDFModal && (
                <div className="modalOverlay" onClick={() => setShowPDFModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modalTitle">Save PDF to Library</div>
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
                        </div>
                        <div className="modalActions">
                            <button className="btn cancelBtn" onClick={() => setShowPDFModal(false)}>
                                Cancel
                            </button>
                            <button className="btn primary" onClick={handlePDFConfirm} disabled={uploading || !pdfTitle.trim()}>
                                {uploading ? "Saving..." : "Save to Library"}
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
