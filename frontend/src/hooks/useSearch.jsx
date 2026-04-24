import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

export function useSearch(courses, enrolledIds) {
    const navigate = useNavigate();
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeIndex, setActiveIndex] = useState(0);
    const searchInputRef = useRef(null);

    const searchResults = searchQuery.trim().length === 0 ? [] : courses.filter(c => {
        const q = searchQuery.toLowerCase();
        return (
            c.courseCode.toLowerCase().includes(q) ||
            c.courseName.toLowerCase().includes(q)
        );
    }).slice(0, 8);

    useEffect(() => {
        function onKeyDown(e) {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                setSearchOpen(true);
            }
            if (e.key === "Escape" && searchOpen) {
                setSearchOpen(false);
                setSearchQuery("");
            }
        }
        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, [searchOpen]);

    useEffect(() => {
        if (searchOpen) {
            setTimeout(() => searchInputRef.current?.focus(), 50);
            setActiveIndex(0);
        } else {
            setSearchQuery("");
        }
    }, [searchOpen]);

    useEffect(() => { setActiveIndex(0); }, [searchQuery]);

    function handleSearchKeyDown(e) {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIndex(i => Math.min(i + 1, searchResults.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex(i => Math.max(i - 1, 0));
        } else if (e.key === "Enter") {
            if (searchResults[activeIndex]) handleSearchSelect(searchResults[activeIndex]);
        }
    }

    function handleSearchSelect(course, onUnenrolled) {
        setSearchOpen(false);
        setSearchQuery("");
        if (enrolledIds.has(course.id)) {
            navigate(`/course/${course.id}`);
        } else {
            onUnenrolled(course);
        }
    }

    function highlightMatch(text, query) {
        if (!query.trim()) return text;
        const idx = text.toLowerCase().indexOf(query.toLowerCase());
        if (idx === -1) return text;
        return (
            <>
                {text.slice(0, idx)}
                <mark className="searchHighlight">{text.slice(idx, idx + query.length)}</mark>
                {text.slice(idx + query.length)}
            </>
        );
    }

    function closeSearch() {
        setSearchOpen(false);
        setSearchQuery("");
    }

    return {
        searchOpen, searchQuery, setSearchQuery,
        activeIndex, setActiveIndex,
        searchResults, searchInputRef,
        handleSearchKeyDown, handleSearchSelect,
        highlightMatch, closeSearch,
        openSearch: () => setSearchOpen(true),
    };
}