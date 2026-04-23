import React from "react";
import { YEARS, SEMESTERS } from "../constants.js";

/**
 * Reusable Metadata Modal
 * Supports:
 *  - PDF upload flow
 *  - Library item -> course flow
 *  - Editing course items
 */
const MetadataModal = ({
    title = "Edit Metadata",

    // Optional title editing (disabled for flashcards)
    itemTitle,
    setItemTitle,
    allowTitleEdit = false,

    // Controlled fields
    year,
    setYear,
    semester,
    setSemester,
    description,
    setDescription,

    // Actions
    onCancel,
    onConfirm,

    // UI state
    confirmText = "Save",
    loading = false,

    // Optional navigation (for library flow)
    onBack,
}) => {
    return (
        <div className="modalOverlay" onClick={onCancel}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modalTitle">{title}</div>

                <div className="pdfForm">

                    {/* Title (optional, disabled for flashcards) */}
                    {allowTitleEdit && (
                        <label className="pdfLabel">
                            Title
                            <input
                                className="pdfInput"
                                value={itemTitle}
                                onChange={(e) => setItemTitle(e.target.value.slice(0, 100))}
                                placeholder="Enter title"
                                maxLength={100}
                            />
                        </label>
                    )}

                    <label className="pdfLabel">
                        Year
                        <select
                            className="pdfSelect"
                            value={year}
                            onChange={(e) => setYear(e.target.value)}
                        >
                            {YEARS.map((y) => (
                                <option key={y} value={y}>
                                    {y}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="pdfLabel">
                        Semester
                        <select
                            className="pdfSelect"
                            value={semester}
                            onChange={(e) => setSemester(e.target.value)}
                        >
                            {SEMESTERS.map((s) => (
                                <option key={s} value={s}>
                                    {s}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="pdfLabel">
                        Description
                        <textarea
                            className="pdfTextarea"
                            value={description}
                            onChange={(e) =>
                                setDescription(e.target.value.slice(0, 255))
                            }
                            placeholder="Add additional information here, e.g. professor(s)"
                            rows={3}
                            maxLength={255}
                        />
                    </label>

                    <p className="pdfWarning">
                        ⚠️ Double-check details before saving.
                    </p>
                </div>

                <div className="modalActions">
                    {onBack && (
                        <button className="btn cancelBtn" onClick={onBack}>
                            ← Back
                        </button>
                    )}

                    <button className="btn cancelBtn" onClick={onCancel}>
                        Cancel
                    </button>

                    <button
                        className="btn primary"
                        onClick={onConfirm}
                        disabled={loading}
                    >
                        {loading ? "Saving..." : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MetadataModal;
