// hooks/useEscapeKey.js

import { useEffect } from "react";

export default function useEscapeKey(handler) {
    useEffect(() => {
        function onKeyDown(e) {
            if (e.key === "Escape") handler();
        }
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [handler]);
}