const BASE = "http://localhost:8080";
const API_BASE = "http://localhost:8080";

/* Personal Library ------------------------------------------- */

export async function getFolders() {
    const res = await fetch(`${API_BASE}/folders`);
    if (!res.ok) throw new Error("Failed to load folders");
    return res.json();
}

export async function createFolder({ name }) {
    const res = await fetch(`${API_BASE}/folders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
    });
    if (!res.ok) throw new Error("Failed to create folder");
    return res.json();
}

export async function deleteFolder(folderId) {
    const res = await fetch(`${API_BASE}/folders/${folderId}`, {
        method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete folder");
}

async function request(path, options = {}) {
    const res = await fetch(`${BASE}${path}`, {
        headers: { "Content-Type": "application/json", ...(options.headers || {}) },
        ...options,
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `HTTP ${res.status}`);
    }

    // Handle endpoints that return no body (common for PATCH/DELETE)
    if (res.status === 204) return null;

    // Only parse JSON if it’s actually JSON
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
        return res.json();
    }

    // Otherwise just return text (or null)
    const text = await res.text().catch(() => "");
    return text || null;
}

export function renameFolder(folderId, newName) {
    return request(`/folders/${folderId}/rename`, {
        method: "PATCH",
        body: JSON.stringify({ newName }),
    });
}

export function setFolderStarred(folderId, starred) {
    return request(`/folders/${folderId}/starred`, {
        method: "PATCH",
        body: JSON.stringify({ starred }),
    });
}

export async function toggleItemStarred(itemId) {
    const res = await fetch(`${API_BASE}/library-items/${itemId}/star`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error("Failed to update star");
    return res.json();
}

export async function getFolderItems(folderId) {
    const res = await fetch(`http://localhost:8080/folders/${folderId}/items`);
    if (!res.ok) throw new Error("Failed to load folder items");
    return res.json();
}

export async function setFolderPrivacy(folderId, isPublic) {
    // return request(`/folders/${folderId}/privacy`, {
    //     method: "PATCH",
    //     body: JSON.stringify({isPublic})
    // })

    const res = await fetch(`http://localhost:8080/folders/${folderId}/privacy`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic }),
    });
    if (!res.ok) throw new Error("Failed to update folder privacy");
    return res.json();
}

export async function getLibraryItems() {
    const res = await fetch(`${API_BASE}/library-items`);
    if (!res.ok) throw new Error("Failed to load library items");
    return res.json();
}

export async function moveItemToFolder(itemId, folderId) {
    const res = await fetch(`${API_BASE}/library-items/${itemId}/folder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderId }),
    });
    if (!res.ok) throw new Error("Failed to move item");
    return res.json();
}

export async function removeItemFromFolder(itemId) {
    const res = await fetch(`${API_BASE}/library-items/${itemId}/folder`, {
        method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to remove item from folder");
}

/* Flashcards ------------------------------------------- */

export async function getFlashcardSetById(id) {
    const res = await fetch(`${BASE}/api/flashcard-sets/${id}`);
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Failed to load flashcard set");
    }
    return res.json();
}

export async function updateFlashcardSetMeta(id, { title, description, university, course}) {
    const res = await fetch(`/api/flashcard-sets/${id}/meta`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, university, course }),
    });
    if (!res.ok) throw new Error('Failed to update set');
    return res.json();
}

export async function updateFlashcard(setId, flashcardId, cardData) {
    const res = await fetch(`/api/flashcard-sets/${setId}/flashcards/${flashcardId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cardData),
    });
    if (!res.ok) throw new Error('Failed to update flashcard');
    return res.json();
}

export async function generateSharedLink(flashcardSetId) {
    const res = await fetch('/api/shared-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flashcardSetId }),
    });
    if (!res.ok) throw new Error('Failed to generate link');
    return res.json(); // { token }
}

export async function resolveSharedLink(token) {
    const res = await fetch(`/api/shared-links/${token}`);
    if (res.status === 410) throw new Error('This link has expired.');
    if (!res.ok) throw new Error('Link not found.');
    return res.json();
}

/* Goals ------------------------------------------- */

export async function getGoal(userId) {
    const res = await fetch(`${API_BASE}/goals/${userId}`);
    if (!res.ok) throw new Error("Failed to load goal");
    return res.json();
}

export async function updateGoal(userId, { selectedDaysOfWeek, minutesPerDay }) {
    const res = await fetch(`${API_BASE}/goals/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedDaysOfWeek, minutesPerDay }),
    });
    if (!res.ok) throw new Error("Failed to update goal");
    return res.json();
}

export async function startStudying(userId) {
    const res = await fetch(`${API_BASE}/goals/${userId}/start`, { method: "POST" });
    if (!res.ok) throw new Error("Failed to start studying");
}

export async function stopStudying(userId) {
    const res = await fetch(`${API_BASE}/goals/${userId}/stop`, { method: "POST" });
    if (!res.ok) throw new Error("Failed to stop studying");
}

/* University & Courses ------------------------------------------- */

export async function getUniversity(userId) {
    const res = await fetch(`${API_BASE}/api/users/${userId}/university`);
    if (!res.ok) throw new Error("Failed to fetch university");
    return res.json();
}

export async function getCourses(universityId) {
    const res = await fetch(`${API_BASE}/api/universities/${universityId}/courses`);
    if (!res.ok) throw new Error("Failed to fetch courses");
    return res.json();
}

export async function getEnrolledCourses(userId) {
    const res = await fetch(`${API_BASE}/api/users/${userId}/enrolled-courses`);
    if (!res.ok) throw new Error("Failed to fetch enrolled courses");
    return res.json();
}

export async function enrollInCourse(userId, courseId) {
    const res = await fetch(`${API_BASE}/api/users/${userId}/enroll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
    });
    if (!res.ok) throw new Error("Failed to enroll in course");
    return res.json();
}

export async function getCourse(courseId) {
    const res = await fetch(`${API_BASE}/api/universities/course/${courseId}`);
    if (!res.ok) throw new Error("Failed to fetch course");
    return res.json();
}

export async function unenrollFromCourse(userId, courseId) {
    const res = await fetch(`${API_BASE}/api/users/${userId}/unenroll/${courseId}`, {
        method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to unenroll from course");
}

export async function uploadPDF(file, title) {
    const formData = new FormData();
    formData.append("file", file);
    if (title) formData.append("title", title);

    const res = await fetch(`${API_BASE}/library-items/upload`, {
        method: "POST",
        body: formData,
    });
    if (!res.ok) throw new Error("Failed to upload PDF");
    return res.json();
}

export async function uploadPDFToCourse(file, title, year, semester, description, courseId) {
    const formData = new FormData();
    formData.append("file", file);
    if (title) formData.append("title", title);
    if (year) formData.append("year", year);
    if (semester) formData.append("semester", semester);
    if (description) formData.append("description", description);
    formData.append("courseId", courseId);

    const res = await fetch(`${API_BASE}/library-items/upload/course`, {
        method: "POST",
        body: formData,
    });
    if (!res.ok) throw new Error("Failed to upload PDF to course");
    return res.json();
}

export async function recordAccess(itemId) {
    await fetch(`${API_BASE}/library-items/${itemId}/access`, {
        method: "POST",
    });
}

export function openPDF(itemId) {
    window.open(`${API_BASE}/library-items/${itemId}/file`, "_blank");
}

export function downloadPDF(itemId, title) {
    const a = document.createElement("a");
    a.href = `${API_BASE}/library-items/${itemId}/download`;
    a.download = title ?? "document.pdf";
    a.click();
}

export async function getCourseItems(courseId) {
    const res = await fetch(`${API_BASE}/course-library-items/course/${courseId}`);
    if (!res.ok) throw new Error("Failed to fetch course items");
    return res.json();
}