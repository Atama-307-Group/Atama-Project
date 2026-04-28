import { useMemo } from "react";

export default function useFilteredItems(items, query, sortBy, filters) {
    const { filterTypes, filterSemesters, filterYearMin, filterYearMax, filterIncludeUnknownYear } = filters;

    return useMemo(() => {
        const q = query.trim().toLowerCase();

        function safeTime(x) {
            const t = x ? new Date(x).getTime() : 0;
            return Number.isFinite(t) ? t : 0;
        }

        function compareBySort(a, b) {
            const titleA = a.libraryItem?.title ?? "";
            const titleB = b.libraryItem?.title ?? "";

            const parseYear = (item) => {
                const n = parseInt(item.year, 10);
                return Number.isFinite(n) ? n : null;
            };

            switch (sortBy) {
                case "alpha-desc": return titleB.localeCompare(titleA);
                case "created-desc": {
                    const ya = parseYear(a) ?? -Infinity;
                    const yb = parseYear(b) ?? -Infinity;
                    return yb - ya;
                }
                case "created-asc": {
                    const ya = parseYear(a) ?? Infinity;
                    const yb = parseYear(b) ?? Infinity;
                    return ya - yb;
                }
                case "accessed-desc": return safeTime(b.libraryItem?.lastAccessed) - safeTime(a.libraryItem?.lastAccessed);
                case "alpha-asc":
                default: return titleA.localeCompare(titleB);
            }
        }

        return [...items]
            .filter(item => {
                if (q) {
                    const titleMatch = (item.libraryItem?.title ?? "").toLowerCase().includes(q);
                    const descMatch = (item.description ?? "").toLowerCase().includes(q);
                    if (!titleMatch && !descMatch) return false;
                }
                if (filterTypes.size > 0) {
                    const type = item.libraryItem?.itemType ?? "PDF";
                    if (!filterTypes.has(type)) return false;
                }
                if (filterSemesters.size > 0) {
                    const sem = item.semester ?? "Unknown";
                    if (!filterSemesters.has(sem)) return false;
                }
                const itemYear = item.year ?? "Unknown";
                if (itemYear === "Unknown") {
                    if (!filterIncludeUnknownYear) return false;
                } else {
                    const y = parseInt(itemYear, 10);
                    if (Number.isFinite(y) && (y < filterYearMin || y > filterYearMax)) return false;
                }
                return true;
            })
            .sort(compareBySort);
    }, [items, query, sortBy, filterTypes, filterSemesters, filterYearMin, filterYearMax, filterIncludeUnknownYear]);
}