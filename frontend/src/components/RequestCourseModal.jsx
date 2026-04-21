import { useState } from "react";
import "./RequestCourseModal.css";

const RequestCourseModal = ({ university, userId, onClose }) => {
    const [code, setCode] = useState("");
    const [name, setName] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit() {
        const trimmedCode = code.trim();
        const trimmedName = name.trim();
        if (!trimmedCode || !trimmedName) {
            setError("Both fields are required.");
            return;
        }
        setError("");
        setSubmitting(true);
        try {
            const res = await fetch("/api/course-requests", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    universityId: university?.id,
                    userId,
                    code: trimmedCode,
                    name: trimmedName,
                }),
            });
            if (!res.ok) throw new Error("Request failed");
            setSubmitted(true);
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="modalOverlay" onClick={onClose}>
            <div className="modal requestModal" onClick={e => e.stopPropagation()}>
                {submitted ? (
                    <>
                        <div className="requestSuccessIcon">✓</div>
                        <div className="modalTitle">Request submitted!</div>
                        <p className="modalBody">
                            Your request for <strong>{code.trim()}</strong> has been sent. The admin team will review it shortly.
                        </p>
                        <div className="modalActions">
                            <button className="btn primary" onClick={onClose}>Done</button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="modalTitle">Request a course</div>
                        <p className="modalBody requestModalSubtitle">
                            Can't find your course? Ask for it to be added.
                        </p>

                        <div className="requestWarning">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            Please double-check the course code and name before submitting. Accurate information helps us process your request faster.
                        </div>

                        <div className="requestFields">
                            <div className="requestField">
                                <label className="requestLabel">Course code</label>
                                <input
                                    className="requestInput"
                                    placeholder="e.g. CS 37000 (full code, no abbreviations)"
                                    value={code}
                                    onChange={e => setCode(e.target.value)}
                                    autoFocus
                                    spellCheck="false"
                                />
                            </div>
                            <div className="requestField">
                                <label className="requestLabel">Course name</label>
                                <input
                                    className="requestInput"
                                    placeholder="e.g. Software Engineering"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    onKeyDown={e => e.key === "Enter" && handleSubmit()}
                                    spellCheck="false"
                                />
                            </div>
                        </div>

                        {error && <div className="requestError">{error}</div>}

                        <div className="modalActions">
                            <button className="btn cancelBtn" onClick={onClose}>Cancel</button>
                            <button className="btn primary" onClick={handleSubmit} disabled={submitting}>
                                {submitting ? "Submitting…" : "Submit request"}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default RequestCourseModal;