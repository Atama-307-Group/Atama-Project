export const YEARS = ["Unknown", ...Array.from({ length: 10 }, (_, i) => String(new Date().getFullYear() - i))];
export const NUMERIC_YEARS = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);
export const SEMESTERS = ["Unknown", "Fall", "Spring", "Summer", "Winter"];
export const ITEM_TYPES = ["PDF", "FLASHCARD_SET", "PRACTICE_TEST"];
export const SORT_LABELS = {
    "alpha-asc": "Alphabetical (A → Z)",
    "alpha-desc": "Alphabetical (Z → A)",
    "created-desc": "Date added (Newest)",
    "created-asc": "Date added (Oldest)",
    "accessed-desc": "Last accessed by you"
};