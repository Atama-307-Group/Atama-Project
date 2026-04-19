import { useState, useEffect, useCallback, useRef } from "react";
import { getGoal, getCountdowns } from "../api.js";
import "./DesktopNotification.css";

/**
 * DesktopNotification – renders desktop-style toast popups inside the browser
 * window. It polls the backend to determine when to show notifications for:
 *   1. Study reminders  (based on Goal notifyByDesktop + notificationTime)
 *   2. Exam countdowns   (based on reminderMinutesBefore + notifyByDesktop)
 *
 * Props:
 *   userId – the logged-in user's UUID (or null)
 */
const DesktopNotification = ({ userId }) => {
    const [notifications, setNotifications] = useState([]);
    const shownIdsRef = useRef(new Set());   // prevent duplicate toasts
    const nextIdRef = useRef(1);

    /* ── helpers ── */

    const addNotification = useCallback((title, body, icon = "📚") => {
        const id = nextIdRef.current++;
        setNotifications((prev) => [
            ...prev,
            { id, title, body, icon, createdAt: Date.now() },
        ]);
        // auto-dismiss after 15 seconds
        setTimeout(() => {
            setNotifications((prev) => prev.filter((n) => n.id !== id));
        }, 15000);
    }, []);

    const dismiss = useCallback((id) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, []);

    /* ── Study reminder check ── */

    const
    checkStudyReminder = useCallback(async () => {
        if (!userId) return;
        try {
            const goal = await getGoal(userId);
            if (!goal.notifyByDesktop || !goal.notificationTime) return;

            // Compare current HH:MM with notificationTime
            const now = new Date();
            const [h, m] = goal.notificationTime.substring(0, 5).split(":").map(Number);
            if (now.getHours() !== h || now.getMinutes() !== m) return;

            // Check if today is a study day
            const jsDayMap = {
                1: "MONDAY", 2: "TUESDAY", 3: "WEDNESDAY",
                4: "THURSDAY", 5: "FRIDAY", 6: "SATURDAY", 0: "SUNDAY",
            };
            const todayJava = jsDayMap[now.getDay()];
            if (!goal.selectedDaysOfWeek || !goal.selectedDaysOfWeek.includes(todayJava)) return;

            const key = `study-${now.toDateString()}-${h}-${m}`;
            if (shownIdsRef.current.has(key)) return;
            shownIdsRef.current.add(key);

            addNotification(
                "Time to Study! 📖",
                `Your goal for today is ${goal.minutesPerDay} minutes of studying. Open a flashcard set and start learning!`,
                "🖥️"
            );
        } catch {
            /* silent */
        }
    }, [userId, addNotification]);

    /* ── Exam countdown reminder check ── */

    const checkExamReminders = useCallback(async () => {
        if (!userId) return;
        try {
            const countdowns = await getCountdowns(userId);
            const now = Date.now();

            for (const c of countdowns) {
                if (!c.notifyByDesktop || c.reminderMinutesBefore <= 0) continue;

                const examTime = new Date(c.examDateTime).getTime();
                const windowStart = examTime - c.reminderMinutesBefore * 60 * 1000;

                if (now >= windowStart && now < examTime) {
                    const key = `exam-${c.id}`;
                    if (shownIdsRef.current.has(key)) continue;
                    shownIdsRef.current.add(key);

                    const diff = examTime - now;
                    const mins = Math.round(diff / 60000);
                    const label =
                        mins >= 1440
                            ? `${Math.round(mins / 1440)} day(s)`
                            : mins >= 60
                                ? `${Math.floor(mins / 60)}h ${mins % 60}m`
                                : `${mins} min`;

                    addNotification(
                        "Exam Reminder 🔔",
                        `${c.reason} is in ${label}. Time to prepare!`,
                        "📅"
                    );
                }
            }
        } catch {
            /* silent */
        }
    }, [userId, addNotification]);

const checkCourseLeaveNotification = useCallback(async () => {
    if (!userId) return;
    try {
        const res = await fetch(`/api/users/${userId}/schedule-leave/status`);
        const data = await res.json();
        if (!data.executedAt) return;

        const key = `course-leave-${data.executedAt}`;
        if (localStorage.getItem(key)) return;
        localStorage.setItem(key, "true");

        addNotification(
            "Courses Left",
            "You have been automatically unenrolled from all your courses.",
            "📅"
        );
    } catch {
        /* silent */
    }
}, [userId, addNotification]);

    /* ── Polling ── */

    useEffect(() => {
        checkStudyReminder();
        checkExamReminders();
        checkCourseLeaveNotification();

        const interval = setInterval(() => {
            checkStudyReminder();
            checkExamReminders();
            checkCourseLeaveNotification();
        }, 30000);

        return () => clearInterval(interval);
    }, [checkStudyReminder, checkExamReminders, checkCourseLeaveNotification]);

    /* ── Render ── */

    if (notifications.length === 0) return null;

    return (
        <div className="desktopNotifContainer">
            {notifications.map((n) => (
                <div key={n.id} className="desktopNotif">
                    <div className="desktopNotifIcon">{n.icon}</div>
                    <div className="desktopNotifBody">
                        <div className="desktopNotifAppName">Atama</div>
                        <div className="desktopNotifTitle">{n.title}</div>
                        <div className="desktopNotifText">{n.body}</div>
                    </div>
                    <button
                        className="desktopNotifClose"
                        onClick={() => dismiss(n.id)}
                        title="Dismiss"
                    >
                        ✕
                    </button>
                </div>
            ))}
        </div>
    );
};

export default DesktopNotification;
