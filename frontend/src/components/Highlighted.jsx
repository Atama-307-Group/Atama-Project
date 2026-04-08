import { } from "react";

function getHighlightSegments(text, query) {
    if (!query || !text) return [{ text, match: false }];
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escaped})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, i) => ({
        text: part,
        match: i % 2 === 1,
    }));
}

export default function Highlighted({ text, query }) {
    const segments = getHighlightSegments(text, query);
    return (
        <span>
            {segments.map((seg, i) =>
                seg.match
                    ? <mark key={i} className="searchHighlight">{seg.text}</mark>
                    : <span key={i}>{seg.text}</span>
            )}
        </span>
    );
}