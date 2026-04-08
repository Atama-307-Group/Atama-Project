import { YEARS, SEMESTERS } from "../constants.js";

export default function MetadataModal({
    pdfTitle,
    onTitleChange,
    pdfYear,
    onYearChange,
    pdfSemester,
    onSemesterChange,
    pdfDescription,
    onDescriptionChange,
    uploading,
    onConfirm,
    onCancel,
}) {
    return (
        <div className="modalOverlay" onClick={onCancel}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modalTitle">Save PDF to Course</div>
                <div className="pdfForm">
                    <label className="pdfLabel">
                        Name
                        <input
                            className="pdfInput"
                            type="text"
                            value={pdfTitle}
                            onChange={e => onTitleChange(e.target.value)}
                        />
                    </label>
                    <label className="pdfLabel">
                        Year
                        <select className="pdfSelect" value={pdfYear} onChange={e => onYearChange(e.target.value)}>
                            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </label>
                    <label className="pdfLabel">
                        Semester
                        <select className="pdfSelect" value={pdfSemester} onChange={e => onSemesterChange(e.target.value)}>
                            {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </label>
                    <label className="pdfLabel">
                        Description
                        <textarea
                            className="pdfTextarea"
                            value={pdfDescription}
                            onChange={e => onDescriptionChange(e.target.value.slice(0, 255))}
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
                    <button className="btn cancelBtn" onClick={onCancel}>
                        Cancel
                    </button>
                    <button className="btn primary" onClick={onConfirm} disabled={uploading || !pdfTitle.trim()}>
                        {uploading ? "Saving..." : "Save to Course"}
                    </button>
                </div>
            </div>
        </div>
    );
}