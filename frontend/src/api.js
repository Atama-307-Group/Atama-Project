const BASE = "http://localhost:8080";
const API_BASE = "http://localhost:8080";

/* Personal Library ------------------------------------------- */

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

export async function deleteLibraryItem(itemId) {
    const res = await fetch(`${API_BASE}/library-items/${itemId}`, {
        method: "DELETE",
        credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to delete library item");
}

export async function renameLibraryItem(itemId, title) {
    const res = await fetch(`${API_BASE}/library-items/${itemId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
    });
    if (!res.ok) throw new Error("Failed to rename item");
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

    // Only parse JSON if it's actually JSON
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
    const res = await fetch(`${API_BASE}/folders/${folderId}/privacy`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic }),
    });
    if (!res.ok) throw new Error("Failed to update folder privacy");
    return res.json();
}

export async function getLibraryContents() {
    const res = await fetch(`${API_BASE}/api/libraries/me/contents`, {
        credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to load library");
    return res.json();
}

/* Flashcards ------------------------------------------- */

export async function getFlashcardSetById(id) {
    const res = await fetch(`${BASE}/api/flashcard-sets/${id}`, {
        credentials: "include",
    });
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Failed to load flashcard set");
    }
    return res.json();
}

export async function updateFlashcardSetMeta(id, { title, description, university, course }) {
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

export async function saveSet(id) {
    const res = await fetch(`${API_BASE}/api/flashcard-sets/${id}/save`, { method: 'POST', credentials: 'include' });
    if (!res.ok) throw new Error('Failed to save set');
}

export async function unsaveSet(id) {
    const res = await fetch(`${API_BASE}/api/flashcard-sets/${id}/save`, { method: 'DELETE', credentials: 'include' });
    if (!res.ok) throw new Error('Failed to unsave set');
}

export async function getSavedSets() {
    const res = await fetch(`${API_BASE}/api/flashcard-sets/saved`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch saved sets');
    return res.json();
}
export async function updateSetPrivacy(id, isPublic) {
    const res = await fetch(`${API_BASE}/api/flashcard-sets/${id}/privacy`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublic }),
    });
    if (!res.ok) throw new Error('Failed to update privacy');
    return res.json();
}

export async function deleteFlashcardSet(setId) {
    const res = await fetch(`${API_BASE}/flashcard-sets/${setId}`, {
        method: "DELETE",
        credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to delete flashcard set");
}

/* Goals ------------------------------------------- */

export async function getGoal(userId) {
    const res = await fetch(`${API_BASE}/goals/${userId}`, {
        credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to load goal");
    const text = await res.text();
    return text ? JSON.parse(text) : null;
}

export async function updateGoal(userId, { selectedDaysOfWeek, minutesPerDay, notifyByDesktop, notifyByEmail, notificationTime }) {
    const res = await fetch(`${API_BASE}/goals/${userId}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedDaysOfWeek, minutesPerDay, notifyByDesktop, notifyByEmail, notificationTime }),
    });
    const text = await res.text();
    if (!res.ok) {
        throw new Error(`Failed to update goal. Status: ${res.status}. Error: ${text}`);
    }
    return text ? JSON.parse(text) : null;
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

/* Countdowns ------------------------------------------- */

export async function getCountdowns(userId) {
    const res = await fetch(`${API_BASE}/api/countdowns/${userId}`, {
        credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to load countdowns");
    return res.json();
}

export async function createCountdown(userId, { reason, examDateTime, reminderMinutesBefore, notifyByDesktop, notifyByEmail }) {
    const res = await fetch(`${API_BASE}/api/countdowns/${userId}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, examDateTime, reminderMinutesBefore, notifyByDesktop, notifyByEmail }),
    });
    if (!res.ok) throw new Error("Failed to create countdown");
    return res.json();
}

export async function deleteCountdown(countdownId) {
    const res = await fetch(`${API_BASE}/api/countdowns/${countdownId}`, {
        method: "DELETE",
        credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to delete countdown");
}

export async function deleteExpiredCountdowns(userId) {
    const res = await fetch(`${API_BASE}/api/countdowns/${userId}/expired`, {
        method: "DELETE",
        credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to delete expired countdowns");
}

/* University & Courses ------------------------------------------- */

export async function getUniversity() {
    const res = await fetch(`${API_BASE}/api/users/university`, {
        credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch university");
    return res.json();
}

export async function getCourses(universityId) {
    const res = await fetch(`${API_BASE}/api/universities/${universityId}/courses`, {
        credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch courses");
    return res.json();
}

export async function getEnrolledCourses(userId) {
    const res = await fetch(`${API_BASE}/api/users/enrolled-courses`, {
        credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch enrolled courses");
    return res.json();
}

export async function enrollInCourse(userId, courseId) {
    const res = await fetch(`${API_BASE}/api/users/${userId}/enroll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
        credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to enroll in course");
    return res.json();
}

export async function getCourse(courseId) {
    const res = await fetch(`${API_BASE}/api/universities/course/${courseId}`, {
        credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch course");
    return res.json();
}

export async function unenrollFromAllCourses(userId) {
    const res = await fetch(`${API_BASE}/api/users/${userId}/unenroll-all`, {
        method: "DELETE",
        credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to unenroll from all courses");
}

export async function unenrollFromCourse(userId, courseId) {
    const res = await fetch(`${API_BASE}/api/users/${userId}/unenroll/${courseId}`, {
        method: "DELETE",
        credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to unenroll from course");
}

export async function uploadPDF(file, title) {
    const formData = new FormData();
    formData.append("file", file);
    if (title) formData.append("title", title);

    const res = await fetch(`${API_BASE}/library-items/upload`, {
        method: "POST",
        credentials: "include",
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
        credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to upload PDF to course");
    return res.json();
}

export async function updateCourseLibraryItem(id, year, semester, description) {
    const res = await fetch(`${API_BASE}/course-library-items/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year, semester, description }),
    });
    if (!res.ok) throw new Error("Failed to update item");
    return res.json();
}

export async function updateCourseLibraryItemTitle(id, { title }) {
    const res = await fetch(`${API_BASE}/library-items/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
    });
    if (!res.ok) throw new Error("Failed to update library item");
    return res.json();
}


export async function deleteCourseLibraryItem(id) {
    const res = await fetch(`${API_BASE}/course-library-items/${id}`, {
        method: "DELETE",
        credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to remove item");
}

export async function recordAccess(itemId) {
    await fetch(`${API_BASE}/library-items/${itemId}/access`, {
        method: "POST",
        credentials: "include",
    });
}

export async function updateCourseLibraryItem(id, year, semester, description) {
    const res = await fetch(`${API_BASE}/course-library-items/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year, semester, description }),
    });
    if (!res.ok) throw new Error("Failed to update item");
    return res.json();
}

export async function deleteCourseLibraryItem(id) {
    const res = await fetch(`${API_BASE}/course-library-items/${id}`, {
        method: "DELETE",
        credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to remove item");
}

export function openPDF(itemId) {
    window.open(`${API_BASE}/library-items/${itemId}/file`, "_blank");
}

export async function getStreak(userId) {
    const res = await fetch(`${API_BASE}/goals/users/${userId}/streak`, {
        credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch streak");
    return res.json();
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
export async function uploadFlashcardSet(file, title, description, university, course, isPublic = true ) {
    const formData = new FormData();
    formData.append("file", file);
    if (title) formData.append("title", title);
    if (description) formData.append("description", description);
    if (university) formData.append("university", university);
    if (course) formData.append("course", course);
    formData.append("isPublic", isPublic);

    const res = await fetch(`${API_BASE}/api/flashcard-sets/upload`, {
        method: "POST",
        credentials: "include",
        body: formData,
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to upload set");
    }
    return res.json();
}


export async function createFlashcardSet({ title, description, university, course, flashcards, isPublic = true }) {
    const response = await fetch(`${API_BASE}/api/flashcard-sets`, {
        method: 'POST',
        credentials: "include",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, university, course, flashcards, isPublic })
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

export function downloadPDF(itemId, title) {
    const a = document.createElement("a");
    a.href = `${API_BASE}/library-items/${itemId}/download`;
    a.download = title ?? "document.pdf";
    a.click();
}

export async function getCourseItems(courseId) {
    const res = await fetch(`${API_BASE}/course-library-items/course/${courseId}`, {
        credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch course items");
      console.log("fetching course items for:", courseId);


    return res.json();
}

export async function addLibraryItemToCourse(libraryItemId, courseId, year, semester, description) {
    const res = await fetch(`${API_BASE}/course-library-items`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ libraryItemId, courseId, year, semester, description }),
    });
    if (!res.ok) throw new Error("Failed to add item to course");
    return res.json();
}

export async function getSetProgress(setId) {
    const res = await fetch(`${API_BASE}/api/flashcard-sets/${setId}/progress`, {
        credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to load progress");
    return res.json();
}

export async function updateCardProgress(setId, flashcardId, knowledgeLevel) {
    const res = await fetch(`${API_BASE}/api/flashcard-sets/${setId}/flashcards/${flashcardId}/progress`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ knowledgeLevel }),
    });
    if (!res.ok) throw new Error("Failed to update progress");
    return res.json();
}

export async function addSetStudyTime(setId, seconds) {
    if (!seconds || seconds <= 0) return;
    const res = await fetch(`${API_BASE}/api/flashcard-sets/${setId}/study-time`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seconds }),
    });
    if (!res.ok) throw new Error("Failed to record study time");
}

export async function getSetStats(setId) {
    const res = await fetch(`${API_BASE}/api/flashcard-sets/${setId}/stats`, {
        credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to load stats");
    return res.json();
}
export async function searchLibrary(q) {
    const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(q)}`, {
        credentials: "include",
    });
    if (!res.ok) throw new Error("Search failed");
    return res.json();
}

export async function getMyReview(setId) {
    const res = await fetch(`${API_BASE}/api/flashcard-sets/${setId}/reviews/mine`, {
        credentials: "include",
    });
    if (res.status === 204) return null; // no review yet
    if (!res.ok) throw new Error("Failed to fetch review");
    return res.json();
}

export async function upsertReview(setId, stars, tags) {
    const res = await fetch(`${API_BASE}/api/flashcard-sets/${setId}/reviews`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stars, tags }),
    });
    if (!res.ok) throw new Error("Failed to submit review");
    return res.json();
}

export async function deleteReview(setId) {
    const res = await fetch(`${API_BASE}/api/flashcard-sets/${setId}/reviews/mine`, {
        method: "DELETE",
        credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to delete review");
}

/* Study Groups ------------------------------------------- */

export async function getGroup(groupId) {
    const res = await fetch(`${API_BASE}/api/groups/${groupId}`, {
        credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch group");
    return res.json();
}

export async function getGroupsByCourse(courseId) {
    const res = await fetch(`${API_BASE}/api/courses/${courseId}/groups`, {
        credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch study groups");
    return res.json();
}

export async function createGroup(groupData, creatorId) {
    const res = await fetch(`${API_BASE}/api/groups?creatorId=${creatorId}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(groupData),
    });
    if (!res.ok) throw new Error("Failed to create group");
    return res.json();
}

export async function joinPublicGroup(groupId, userId) {
    const res = await fetch(`${API_BASE}/api/groups/${groupId}/join?userId=${userId}`, {
        method: "POST",
        credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to join group");
    return res.json();
}

export async function joinGroupByToken(token, userId) {
    const res = await fetch(`${API_BASE}/api/groups/join?token=${token}&userId=${userId}`, {
        method: "POST",
        credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to join group");
    return res.json();
}

export async function leaveGroup(groupId, userId) {
    const res = await fetch(`${API_BASE}/api/groups/${groupId}/members/${userId}`, {
        method: "DELETE",
        credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to leave group");
}

export async function getGroupMembers(groupId) {
    const res = await fetch(`${API_BASE}/api/groups/${groupId}/members`, {
        credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch members");
    return res.json();
}

export async function getUserGroups(userId) {
    const res = await fetch(`${API_BASE}/api/users/${userId}/groups`, {
        credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch your groups");
    return res.json();
}

export async function getGroupLeaderboard(groupId) {
    const res = await fetch(`${API_BASE}/api/groups/${groupId}/leaderboard`, {
        credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch leaderboard");
    return res.json();
}

/* Concept Maps ------------------------------------------- */

export async function generateConceptMap(setId, selectedCardIds, title) {
    const res = await fetch(`${API_BASE}/api/concept-maps/generate`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setId, selectedCardIds, title }),
    });
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Failed to generate concept map");
    }
    return res.json();
}

export async function createManualConceptMap(setId, selectedCardIds, title) {
    const res = await fetch(`${API_BASE}/api/concept-maps`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setId, selectedCardIds, title }),
    });
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Failed to create concept map");
    }
    return res.json();
}

export async function uploadConceptMapPng(mapId, file) {
    const formData = new FormData();
    formData.append("file", file);
    
    const res = await fetch(`${API_BASE}/api/concept-maps/${mapId}/png`, {
        method: "POST",
        credentials: "include",
        body: formData,
    });
    if (!res.ok) throw new Error("Failed to upload PNG");
    return res.json();
}

export async function getConceptMap(id) {
    const res = await fetch(`${API_BASE}/api/concept-maps/${id}`, {
        credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to load concept map");
    return res.json();
}

export const updateConceptMapGraph = async (id, newGraphData) => {
    const res = await fetch(`${API_BASE}/api/concept-maps/${id}/graph`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ graphData: JSON.stringify(newGraphData) }),
    });
    if (!res.ok) throw new Error("Failed to update concept map graph");
    return res.json();
};

export async function getMyConceptMaps() {
    const res = await fetch(`${API_BASE}/api/concept-maps/my-maps`, {
        credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to load concept maps");
    return res.json();
}

/* Multiplayer Games ------------------------------------------- */

export async function hostGame(flashcardSetId) {
    const res = await fetch(`${API_BASE}/api/games/host`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flashcardSetId }),
    });
    if (!res.ok) throw new Error("Failed to host game");
    return res.json();
}

export async function validateGame(joinCode) {
    const res = await fetch(`${API_BASE}/api/games/${joinCode}/validate`, {
        credentials: "include",
    });
    if (!res.ok) throw new Error("Invalid join code");
    return res.text();
}

export async function fetchGameState(joinCode) {
    const res = await fetch(`${API_BASE}/api/games/${joinCode}/state`, {
        credentials: "include",
    });
    if (!res.ok) throw new Error("Could not fetch game state");
    return res.json();
}

export async function updateAiDisabled(userId, aiDisabled) {
    const res = await fetch(`${API_BASE}/api/users/${userId}/ai-disabled`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aiDisabled }),
    });
    if (!res.ok) throw new Error("Failed to update AI preference");
}