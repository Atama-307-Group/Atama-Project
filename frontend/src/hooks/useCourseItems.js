import { useState, useEffect } from "react";
import { getCourseItems } from "../api.js";

export default function useCourseItems(courseId) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!courseId) return;
        setLoading(true);
        getCourseItems(courseId)
            .then(data => setItems(Array.isArray(data) ? data : []))
            .catch(e => setError(e.message ?? "Failed to load course items"))
            .finally(() => setLoading(false));
    }, [courseId]);

    return { items, setItems, loading, error };
}