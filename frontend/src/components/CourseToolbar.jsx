import { useRef, useEffect } from "react";
import { ITEM_TYPES, SEMESTERS, YEARS, NUMERIC_YEARS, SORT_LABELS } from "../constants.js";

export default function CourseToolbar({
    // search
    query,
    onQueryChange,
    // sort
    sortBy,
    onSortChange,
    showSortMenu,
    onToggleSortMenu,
    // filters
    showFilterPanel,
    onToggleFilterPanel,
    activeFilterCount,
    filterTypes,
    filterSemesters,
    filterYearMin,
    filterYearMax,
    filterIncludeUnknownYear,
    onToggleFilterType,
    onToggleFilterSemester,
    onFilterYearMinChange,
    onFilterYearMaxChange,
    onFilterIncludeUnknownYearChange,
    onClearFilters,
    // actions
    onUploadClick,
    onAddFromLibrary,
    fileInputRef,
    onFileChange,
}) {
    const sortMenuRef = useRef(null);
    const filterPanelRef = useRef(null);

    const yearMin = NUMERIC_YEARS[NUMERIC_YEARS.length - 1];
    const yearMax = NUMERIC_YEARS[0];

    useEffect(() => {
        if (!showSortMenu) return;
        function handlePointerDown(e) {
            if (sortMenuRef.current && !sortMenuRef.current.contains(e.target)) onToggleSortMenu(false);
        }
        window.addEventListener("pointerdown", handlePointerDown);
        return () => window.removeEventListener("pointerdown", handlePointerDown);
    }, [showSortMenu]);

    useEffect(() => {
        if (!showFilterPanel) return;
        function handlePointerDown(e) {
            if (filterPanelRef.current && !filterPanelRef.current.contains(e.target)) onToggleFilterPanel(false);
        }
        window.addEventListener("pointerdown", handlePointerDown);
        return () => window.removeEventListener("pointerdown", handlePointerDown);
    }, [showFilterPanel]);

    return (
        <div className="courseToolbar">
            <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                style={{ display: "none" }}
                onChange={onFileChange}
            />
            <button className="toolbarBtn--upload" onClick={onUploadClick}>
                + Upload PDF
            </button>
            <button className="toolbarBtn--library" onClick={onAddFromLibrary}>
                + Add from Library
            </button>

            <div className="courseSearch">
                <input
                    className="courseSearchInput"
                    placeholder="Search titles and descriptions…"
                    value={query}
                    onChange={e => onQueryChange(e.target.value)}
                />
            </div>

            {/* Filter button */}
            <div className="filterWrap" ref={filterPanelRef}>
                <button
                    type="button"
                    className={`toolbarBtn--filter ${activeFilterCount > 0 ? "toolbarBtn--filterActive" : ""}`}
                    onClick={() => onToggleFilterPanel(p => !p)}
                    aria-haspopup="true"
                    aria-expanded={showFilterPanel}
                    title="Filter"
                >
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path d="M1 3h13M3 7h9M5.5 11h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                    </svg>
                    {activeFilterCount > 0 && (
                        <span className="filterBadge">{activeFilterCount}</span>
                    )}
                </button>

                {showFilterPanel && (
                    <div className="filterPanel" role="dialog" aria-label="Filter options">
                        <div className="filterPanelHeader">
                            <span className="filterPanelTitle">Filter</span>
                            {activeFilterCount > 0 && (
                                <button className="filterClearBtn" onClick={onClearFilters}>Clear all</button>
                            )}
                        </div>

                        <div className="filterSection">
                            <div className="filterSectionLabel">Type</div>
                            <div className="filterChips">
                                {ITEM_TYPES.map(type => (
                                    <button
                                        key={type}
                                        className={`filterChip ${filterTypes.has(type) ? "filterChipActive" : ""}`}
                                        onClick={() => onToggleFilterType(type)}
                                    >
                                        {type === "FLASHCARD_SET" ? "Flashcards" : type === "PRACTICE_TEST" ? "Practice Test" : type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="filterSection">
                            <div className="filterSectionLabel">Semester</div>
                            <div className="filterChips">
                                {SEMESTERS.map(sem => (
                                    <button
                                        key={sem}
                                        className={`filterChip ${filterSemesters.has(sem) ? "filterChipActive" : ""}`}
                                        onClick={() => onToggleFilterSemester(sem)}
                                    >
                                        {sem}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="filterSection">
                            <div className="filterSectionLabel">Year</div>
                            <div className="yearRangeRow">
                                <span className="yearRangeLabel">{filterYearMin}</span>
                                <div className="yearRangeSliders">
                                    <input
                                        type="range"
                                        className="yearSlider"
                                        min={yearMin}
                                        max={yearMax}
                                        value={filterYearMin}
                                        onChange={e => onFilterYearMinChange(parseInt(e.target.value, 10))}
                                    />
                                    <input
                                        type="range"
                                        className="yearSlider"
                                        min={yearMin}
                                        max={yearMax}
                                        value={filterYearMax}
                                        onChange={e => onFilterYearMaxChange(parseInt(e.target.value, 10))}
                                    />
                                </div>
                                <span className="yearRangeLabel">{filterYearMax}</span>
                            </div>
                            <label className="filterCheckLabel">
                                <input
                                    type="checkbox"
                                    checked={filterIncludeUnknownYear}
                                    onChange={e => onFilterIncludeUnknownYearChange(e.target.checked)}
                                />
                                Include unknown year
                            </label>
                        </div>
                    </div>
                )}
            </div>

            {/* Sort button */}
            <div className="sortWrap" ref={sortMenuRef}>
                <button
                    type="button"
                    className="toolbarBtn--sort"
                    onClick={() => onToggleSortMenu(p => !p)}
                    aria-haspopup="true"
                    aria-expanded={showSortMenu}
                >
                    ⇅ {SORT_LABELS[sortBy]}
                </button>
                {showSortMenu && (
                    <div className="dropdownMenu" role="menu">
                        {Object.entries(SORT_LABELS).map(([key, label]) => (
                            <button
                                key={key}
                                className={`menuItem ${sortBy === key ? "menuItemActive" : ""}`}
                                onClick={() => { onSortChange(key); onToggleSortMenu(false); }}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}