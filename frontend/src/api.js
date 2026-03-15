const BASE = "http://localhost:8080";
const API_BASE = "http://localhost:8080";


export async function getFolders() {
    const res = await fetch(`${API_BASE}/folders`, {
        credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to load folders");
    return res.json();
}

export async function createFolder({ name }) {
    const res = await fetch(`${API_BASE}/folders`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
    });
    if (!res.ok) throw new Error("Failed to create folder");
    return res.json();
}

export async function deleteFolder(folderId) {
    const res = await fetch(`${API_BASE}/folders/${folderId}`, {
        method: "DELETE",
        credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to delete folder");
}

async function request(path, options = {}) {
    const res = await fetch(`${BASE}${path}`, {
        credentials: "include",
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
        credentials: "include",
        headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error("Failed to update star");
    return res.json();
}

export async function getFolderItems(folderId) {
    const res = await fetch(`${API_BASE}/folders/${folderId}/items`, {
        credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to load folder items");
    return res.json();
}

export async function setFolderPrivacy(folderId, isPublic) {
    // return request(`/folders/${folderId}/privacy`, {
    //     method: "PATCH",
    //     body: JSON.stringify({isPublic})
    // })

    const res = await fetch(`${API_BASE}/folders/${folderId}/privacy`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic }),
    });
    if (!res.ok) throw new Error("Failed to update folder privacy");
    return res.json();
}

export async function getLibraryItems() {
    const res = await fetch(`${API_BASE}/library-items`, {
        credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to load library items");
    return res.json();
}

export async function getFlashcardSetById(id) {
    const res = await fetch(`${BASE}/api/flashcard-sets/${id}`,{
        credentials: "include",
    });
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Failed to load flashcard set");
    }
    return res.json();
}

export async function updateFlashcardSetMeta(id, { title, description, university, course}) {
    const res = await fetch(`/api/flashcard-sets/${id}/meta`, {
        method: 'PATCH',
        credentials: "include",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, university, course }),
    });
    if (!res.ok) throw new Error('Failed to update set');
    return res.json();
}

export async function updateFlashcard(setId, flashcardId, cardData) {
    const res = await fetch(`/api/flashcard-sets/${setId}/flashcards/${flashcardId}`, {
        method: 'PATCH',
        credentials: "include",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cardData),
    });
    if (!res.ok) throw new Error('Failed to update flashcard');
    return res.json();
}

export async function generateSharedLink(flashcardSetId) {
    const res = await fetch('/api/shared-links', {
        method: 'POST',
        credentials: "include",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flashcardSetId }),
    });
    if (!res.ok) throw new Error('Failed to generate link');
    return res.json(); // { token }
}

export async function resolveSharedLink(token) {
    const res = await fetch(`/api/shared-links/${token}`, {
        credentials: "include",
    });
    if (res.status === 410) throw new Error('This link has expired.');
    if (!res.ok) throw new Error('Link not found.');
    return res.json();
}

/* Goals ------------------------------------------- */

export async function getGoal(userId) {
    const res = await fetch(`${API_BASE}/goals/${userId}`, {
        credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to load goal");
    return res.json();
}

export async function updateGoal(userId, { selectedDaysOfWeek, minutesPerDay }) {
    const res = await fetch(`${API_BASE}/goals/${userId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedDaysOfWeek, minutesPerDay }),
    });
    if (!res.ok) throw new Error("Failed to update goal");
    return res.json();
}

export async function startStudying(userId) {
    const res = await fetch(`${API_BASE}/goals/${userId}/start`, {
        method: "POST",
        credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to start studying");
}

export async function stopStudying(userId) {
    const res = await fetch(`${API_BASE}/goals/${userId}/stop`, {
        method: "POST",
        credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to stop studying");
}

export async function moveItemToFolder(itemId, folderId) {
    const res = await fetch(`${API_BASE}/library-items/${itemId}/folder`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderId }),
    });
    if (!res.ok) throw new Error("Failed to move item");
    return res.json();
}

export async function removeItemFromFolder(itemId) {
    const res = await fetch(`${API_BASE}/library-items/${itemId}/folder`, {
        method: "DELETE",
        credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to remove item from folder");
}

export async function uploadPDF(file) {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_BASE}/library-items/upload`, {
        method: "POST",
        credentials: "include",
        body: formData,
    });
    if (!res.ok) throw new Error("Failed to upload PDF");
    return res.json();
}

export async function recordAccess(itemId) {
    await fetch(`${API_BASE}/library-items/${itemId}/access`, {
        method: "POST",
        credentials: "include",
    });
}

export function openPDF(itemId) {
    window.open(`${API_BASE}/library-items/${itemId}/file`, "_blank");
}

export async function logoutUser() {
    const res = await fetch(`${API_BASE}/api/users/logout`, {
        method: "POST",
        credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to logout");
}

// Register a regular user
export async function registerUser({ username, email, password }) {
    const response = await fetch(`${API_BASE}/api/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed.');
    }

    return response.json();
}

// Send a verification code to a Purdue email
export async function sendVerificationCode(email) {
    const response = await fetch(`${API_BASE}/api/users/send-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send verification code.');
    }

    return response.json();
}

// Verify code and register a Purdue user
export async function registerVerifiedUser({ username, email, password, code }) {
    const response = await fetch(`${API_BASE}/api/users/register-verified`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, code })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Verification failed.');
    }

    return response.json();
}

// Create a new flashcard set
export async function createFlashcardSet({ title, description, university, course, flashcards }) {
    const response = await fetch(`${API_BASE}/api/flashcard-sets`, {
        method: 'POST',
        credentials: "include",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, university, course, flashcards })
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to save');
    }

    return response.json();
}

// Login a user
export async function loginUser({ identifier, password }) {
    const response = await fetch(`${API_BASE}/api/users/login`, {
        method: 'POST',
        credentials: "include",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed.');
    }

    return response.json();
}