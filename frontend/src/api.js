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


const BASE = "http://localhost:8080";

async function request(path, options = {}) {
    const res = await fetch(`${BASE}${path}`, {
        headers: { "Content-Type": "application/json", ...(options.headers || {}) },
        ...options,
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `HTTP ${res.status}`);
    }

    // ✅ Handle endpoints that return no body (common for PATCH/DELETE)
    if (res.status === 204) return null;

    // ✅ Only parse JSON if it’s actually JSON
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
        return res.json();
    }

    // ✅ Otherwise just return text (or null)
    const text = await res.text().catch(() => "");
    return text || null;
}

export function renameFolder(id, newName) {
    return request(`/folders/${id}/rename`, {
        method: "PATCH",
        body: JSON.stringify({ newName }),
    });
}