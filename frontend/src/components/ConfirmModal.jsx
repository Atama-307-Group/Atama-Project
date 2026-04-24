import { } from "react";

export function ConfirmModal({ title, onConfirm, onCancel, confirmLabel = "Confirm", confirmClassName = "btn primary", children }) {
    return (
        <div className="modalOverlay" onClick={onCancel}>
            <div
                className="modal"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
            >
                <div className="modalTitle">{title}</div>
                <div className="modalBody">{children}</div>
                <div className="modalActions">
                    <button className="btn cancelBtn" type="button" onClick={onCancel}>
                        Cancel
                    </button>
                    <button className={confirmClassName} type="button" onClick={onConfirm}>
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}