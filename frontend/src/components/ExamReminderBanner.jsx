import { useState, useEffect, useCallback } from "react";
import { getCountdowns } from "../api.js";
import "./ExamReminderBanner.css";

/**
 * Non-intrusive banner that appears at the top of the app when an exam
 * countdown is within its reminder window.
 *
 * Props:
 *   userId  – the logged-in user's UUID (or null)
 */
const ExamReminderBanner = ({ userId }) => {
    const [reminders, setReminders] = useState([]);
    const [dismissed, setDismissed] = useState(new Set());

    const check = useCallback(async () => {
        if (!userId) return;
        try {
            const data = await getCountdowns(userId);
            const now = Date.now();
            const active = data.filter((c) => {
                if (!c.notifyByDesktop) return false;
                if (c.reminderMinutesBefore <= 0) return false;
                const examTime = new Date(c.examDateTime).getTime();
                const windowStart =
                    examTime - c.reminderMinutesBefore * 60 * 1000;
                return now >= windowStart && now < examTime;
            });
            setReminders(active);
        } catch {
            /* silent */
        }
    }, [userId]);

    useEffect(() => {
        check();
        const id = setInterval(check, 30000); // re-check every 30 s
        return () => clearInterval(id);
    }, [check]);

    function dismiss(countdownId) {
        setDismissed((prev) => new Set(prev).add(countdownId));
    }

    const visible = reminders.filter((r) => !dismissed.has(r.id));
    if (visible.length === 0) return null;

    return (
        <div className="examReminderContainer">
            {visible.map((r) => {
                const diff =
                    new Date(r.examDateTime).getTime() - Date.now();
                const mins = Math.max(0, Math.round(diff / 60000));
                const label =
                    mins >= 1440
                        ? `${Math.round(mins / 1440)} day(s)`
                        : mins >= 60
                            ? `${Math.floor(mins / 60)}h ${mins % 60}m`
                            : `${mins} min`;
                return (
                    <div key={r.id} className="examReminderBanner">
                        <span className="examReminderText">
                            📚 <strong>Upcoming:</strong> {r.reason} in{" "}
                            {label}
                        </span>
                        <button
                            className="examReminderDismiss"
                            onClick={() => dismiss(r.id)}
                            title="Dismiss"
                        >
                            ✕
                        </button>
                    </div>
                );
            })}
        </div>
    );
};

export default ExamReminderBanner;
