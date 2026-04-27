import { useRef } from "react";

export function FolderCard({ folder: f, organizeMode, hasSelection, openMenuId, setOpenMenuId, menuRef, onToggleStar, onRenameModal, onPrivacyModal, onDeleteConfirm, onClick }) {
    return (
        <div
            className={`folderCard ${organizeMode && hasSelection ? "folderDropTarget" : ""} ${openMenuId === f.id ? "menuActive" : ""}`}
            onClick={onClick}
        >
            <div className="folderName">{f.name}</div>

            <div className="folderMeta">
                <div className="folderActions">
                    <button
                        type="button"
                        className={`iconBtn starBtn ${f.starred ? "starred" : ""}`}
                        onClick={(e) => { e.stopPropagation(); onToggleStar(f.id); }}
                        title={f.starred ? "Unstar" : "Star"}
                        aria-label={f.starred ? "Unstar folder" : "Star folder"}
                    >
                        {f.starred ? "★" : "☆"}
                    </button>

                    <div className="menuWrap" ref={openMenuId === f.id ? menuRef : null}>
                        <button
                            type="button"
                            className="iconBtn menuTrigger"
                            onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === f.id ? null : f.id); }}
                            aria-label="Folder options"
                            aria-haspopup="true"
                            aria-expanded={openMenuId === f.id}
                        >
                            ⋯
                        </button>

                        {openMenuId === f.id && (
                            <div className="dropdownMenu" role="menu">
                                <button role="menuitem" className="menuItem"
                                    onClick={(e) => { e.stopPropagation(); onRenameModal(f); }}>
                                    ✏ Rename
                                </button>
                                <button type="button" className="menuItem"
                                    onClick={(e) => { e.stopPropagation(); onPrivacyModal(f); }}>
                                    {f.isPublic ? "🔒 Make Private" : "🔓 Make Public"}
                                </button>
                                <button role="menuitem" className="menuItem danger"
                                    onClick={(e) => { e.stopPropagation(); onDeleteConfirm(f.id); }}>
                                    🗑 Delete
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}