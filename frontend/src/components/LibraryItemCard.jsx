import { useRef, useState, useEffect } from "react";

export function LibraryItemCard({ item, organizeMode, isSelected, onToggleStar, onMoveToFolder, onRemoveFromFolder, onDelete, onRename, onClick, onDragStart, folders = [] }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [submenuOpen, setSubmenuOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        if (!menuOpen) return;
        function onPointerDown(e) {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setMenuOpen(false);
                setSubmenuOpen(false);
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
            draggable={organizeMode}
            onDragStart={onDragStart}
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
                                onClick={(e) => { e.stopPropagation(); setMenuOpen(p => !p); setSubmenuOpen(false); }}
                                aria-label="Item options"
                                aria-haspopup="true"
                                aria-expanded={menuOpen}
                            >
                                ⋯
                            </button>

                            {menuOpen && (
                                <div className="dropdownMenu" role="menu">
                                    {onRename && (
                                        <button className="menuItem"
                                            onClick={(e) => { e.stopPropagation(); onRename(item); setMenuOpen(false); }}>
                                            ✏️ Rename
                                        </button>
                                    )}
                                    {onRemoveFromFolder && (
                                        <button className="menuItem"
                                            onClick={(e) => { e.stopPropagation(); onRemoveFromFolder(item.id); setMenuOpen(false); }}>
                                            ↩ Move to main library
                                        </button>
                                    )}
                                    {folders.length > 0 && onMoveToFolder && (
                                        <div className="menuItemSubmenu" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                type="button"
                                                className="menuItem menuItemSubmenuTrigger"
                                                onClick={(e) => { e.stopPropagation(); setSubmenuOpen(p => !p); }}
                                            >
                                                📁 Move to folder ›
                                            </button>
                                            {submenuOpen && (
                                                <div className="submenu" role="menu">
                                                    {folders.map((f) => (
                                                        <button key={f.id} className="menuItem"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                console.log("folder button clicked", item.id, f.id, onMoveToFolder);
                                                                onMoveToFolder(item.id, f.id);
                                                                setMenuOpen(false);
                                                                setSubmenuOpen(false); }}>
                                                            {f.name}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
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