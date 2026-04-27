import { useRef, useState, useEffect } from "react";

export function LibraryItemCard({ item, organizeMode, isSelected, onToggleStar, onMoveToFolder, onDelete, onClick, folders = [] }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        if (!menuOpen) return;
        function onPointerDown(e) {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setMenuOpen(false);
            }
        }
        window.addEventListener("pointerdown", onPointerDown);
        return () => window.removeEventListener("pointerdown", onPointerDown);
    }, [menuOpen]);

    return (
        <div
            className={`itemCard
                ${menuOpen ? "menuActive" : ""}
                ${organizeMode && isSelected ? "selectedItem" : ""}
                ${organizeMode ? "organizeModeItem" : ""}`}
            onClick={onClick}
        >
            <div className="folderName">{item.title}</div>
            <div className="folderMeta">
                <span className="itemTypeBadge">{item.itemType}</span>

                <div className="folderActions">
                    <button
                        type="button"
                        className={`iconBtn starBtn ${item.starred ? "starred" : ""}`}
                        onClick={(e) => { e.stopPropagation(); onToggleStar(item.id); }}
                        title={item.starred ? "Unstar" : "Star"}
                    >
                        {item.starred ? "★" : "☆"}
                    </button>

                    {!organizeMode && (
                        <div className="menuWrap" ref={menuRef}>
                            <button
                                type="button"
                                className="iconBtn menuTrigger"
                                onClick={(e) => { e.stopPropagation(); setMenuOpen(p => !p); }}
                                aria-label="Item options"
                                aria-haspopup="true"
                                aria-expanded={menuOpen}
                            >
                                ⋯
                            </button>

                            {menuOpen && (
                                <div className="dropdownMenu" role="menu">
                                    {folders.length > 0 && (
                                        <div className="menuItemSubmenu">
                                            <span className="menuItem">📁 Move to folder ›</span>
                                            <div className="submenu">
                                                {folders.map((f) => (
                                                    <button key={f.id} className="menuItem"
                                                        onClick={(e) => { e.stopPropagation(); onMoveToFolder(item.id, f.id); setMenuOpen(false); }}>
                                                        {f.name}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    <button className="menuItem danger"
                                        onClick={(e) => { e.stopPropagation(); onDelete(item.id); setMenuOpen(false); }}>
                                        🗑 Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}