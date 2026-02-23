const API_BASE = "http://localhost:8080";

export async function getFolders() {
    const res = await fetch(`${API_BASE}/folders`);
    if (!res.ok) throw new Error("Failed to load folders");
    return res.json();
}

export async function createFolder({ name, libraryId }) {
    const res = await fetch(`${API_BASE}/folders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, libraryId }),
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