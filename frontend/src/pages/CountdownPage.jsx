import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
    getCountdowns,
    createCountdown,
    deleteCountdown,
    deleteExpiredCountdowns,
} from "../api.js";
import "./CountdownPage.css";

/* ──────────── helpers ──────────── */

function timeLeft(targetInstant) {
    const diff = new Date(targetInstant).getTime() - Date.now();
    if (diff <= 0) return null;
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return { d, h, m, s, total: diff };
}

function pad(n) {
    return String(n).padStart(2, "0");
}

function formatCountdown(tl) {
    if (!tl) return "Expired";
    const parts = [];
    if (tl.d > 0) parts.push(`${tl.d}d`);
    parts.push(`${pad(tl.h)}h ${pad(tl.m)}m ${pad(tl.s)}s`);
    return parts.join(" ");
}

function toLocalDateTimeString(date) {
    const y = date.getFullYear();
    const mo = pad(date.getMonth() + 1);
    const d = pad(date.getDate());
    const h = pad(date.getHours());
    const mi = pad(date.getMinutes());
    return `${y}-${mo}-${d}T${h}:${mi}`;
}

/* ──────────── reminder options ──────────── */

const REMINDER_OPTIONS = [
    { label: "5 minutes before", value: 5 },
    { label: "15 minutes before", value: 15 },
    { label: "30 minutes before", value: 30 },
    { label: "1 hour before", value: 60 },
    { label: "2 hours before", value: 120 },
    { label: "1 day before", value: 1440 },
    { label: "No reminder", value: 0 },
];

/* ──────────── Component ──────────── */

const CountdownPage = ({ userId }) => {
    const navigate = useNavigate();
    const [countdowns, setCountdowns] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [tick, setTick] = useState(0); // drives re-renders every second

    // form state
    const defaultDateTime = toLocalDateTimeString(
        new Date(Date.now() + 86400000)
    );
    const [reason, setReason] = useState("");
    const [dateTime, setDateTime] = useState(defaultDateTime);
    const [reminderMinutes, setReminderMinutes] = useState(60);
    const [notifyDesktop, setNotifyDesktop] = useState(true);
    const [notifyEmail, setNotifyEmail] = useState(false);
    const [saving, setSaving] = useState(false);

    const tickRef = useRef();

    /* load + cleanup expired */
    const loadCountdowns = useCallback(async () => {
        if (!userId) return;
        try {
            await deleteExpiredCountdowns(userId);
            const data = await getCountdowns(userId);
            setCountdowns(data);
        } catch (e) {
            console.error(e);
        }
    }, [userId]);

    useEffect(() => {
        loadCountdowns();
    }, [loadCountdowns]);

    /* 1-second ticker */
    useEffect(() => {
        tickRef.current = setInterval(() => setTick((t) => t + 1), 1000);
        return () => clearInterval(tickRef.current);
    }, []);

    /* auto-remove expired every tick */
    useEffect(() => {
        setCountdowns((prev) =>
            prev.filter((c) => {
                const tl = timeLeft(c.examDateTime);
                return tl !== null;
            })
        );
    }, [tick]);

    /* handlers */
    async function handleCreate(e) {
        e.preventDefault();
        if (!reason.trim() || !dateTime) return;
        setSaving(true);
        try {
            const examDateTimeISO = new Date(dateTime).toISOString();
            const created = await createCountdown(userId, {
                reason: reason.trim(),
                examDateTime: examDateTimeISO,
                reminderMinutesBefore: reminderMinutes,
                notifyByDesktop: notifyDesktop,
                notifyByEmail: notifyEmail,
            });
            setCountdowns((prev) => [...prev, created]);
            setReason("");
            setDateTime(toLocalDateTimeString(new Date(Date.now() + 86400000)));
            setReminderMinutes(60);
            setNotifyDesktop(true);
            setNotifyEmail(false);
            setShowForm(false);
        } catch (err) {
            console.error(err);
            alert("Failed to create countdown.");
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(id) {
        try {
            await deleteCountdown(id);
            setCountdowns((prev) => prev.filter((c) => c.id !== id));
        } catch (err) {
            console.error(err);
        }
    }

    /* sort by nearest first */
    const sorted = [...countdowns].sort(
        (a, b) => new Date(a.examDateTime) - new Date(b.examDateTime)
    );

    return (
        <div className="countdownPage">
            <button
                type="button"
                className="cdBackBtn"
                onClick={() => navigate("/")}
            >
                ← Back
            </button>

            <h1>Exam Countdowns</h1>

            {/* Add button */}
            {!showForm && (
                <button
                    type="button"
                    className="cdAddBtn"
                    onClick={() => setShowForm(true)}
                >
                    + Add Countdown
                </button>
            )}

            {/* Inline form */}
            {showForm && (
                <form className="cdForm" onSubmit={handleCreate}>
                    <div className="cdFormField">
                        <label htmlFor="cd-reason">Exam / Reason</label>
                        <input
                            id="cd-reason"
                            type="text"
                            placeholder="e.g. CS 307 Midterm"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            required
                        />
                    </div>

                    <div className="cdFormField">
                        <label htmlFor="cd-datetime">Date &amp; Time</label>
                        <input
                            id="cd-datetime"
                            type="datetime-local"
                            value={dateTime}
                            onChange={(e) => setDateTime(e.target.value)}
                            min={toLocalDateTimeString(new Date())}
                            required
                        />
                    </div>

                    <div className="cdFormField">
                        <label htmlFor="cd-reminder">Remind me</label>
                        <select
                            id="cd-reminder"
                            value={reminderMinutes}
                            onChange={(e) =>
                                setReminderMinutes(Number(e.target.value))
                            }
                        >
                            {REMINDER_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Notification toggles */}
                    <div className="cdFormField">
                        <label>Notification Channels</label>
                        <div className="cdNotifToggles">
                            <label className="cdToggleLabel">
                                <span className="cdToggleIcon">🖥️</span> Desktop
                                <label className="cdToggleSwitch">
                                    <input
                                        type="checkbox"
                                        checked={notifyDesktop}
                                        onChange={(e) => setNotifyDesktop(e.target.checked)}
                                    />
                                    <span className="cdToggleSlider" />
                                </label>
                            </label>
                            <label className="cdToggleLabel">
                                <span className="cdToggleIcon">✉️</span> Email
                                <label className="cdToggleSwitch">
                                    <input
                                        type="checkbox"
                                        checked={notifyEmail}
                                        onChange={(e) => setNotifyEmail(e.target.checked)}
                                    />
                                    <span className="cdToggleSlider" />
                                </label>
                            </label>
                        </div>
                    </div>

                    <div className="cdFormActions">
                        <button
                            type="submit"
                            className="cdBtnPrimary"
                            disabled={saving}
                        >
                            {saving ? "Saving…" : "Create"}
                        </button>
                        <button
                            type="button"
                            className="cdBtnSecondary"
                            onClick={() => setShowForm(false)}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            {/* Countdown cards */}
            {sorted.length === 0 && !showForm && (
                <p className="cdEmpty">
                    No countdowns yet. Add one to start tracking your exams!
                </p>
            )}

            <div className="cdGrid">
                {sorted.map((c) => {
                    const tl = timeLeft(c.examDateTime);
                    const urgent = tl && tl.total < 86400000; // less than 1 day
                    return (
                        <div
                            key={c.id}
                            className={`cdCard ${urgent ? "cdCardUrgent" : ""}`}
                        >
                            <div className="cdCardHeader">
                                <span className="cdCardReason">
                                    {c.reason}
                                </span>
                                <button
                                    className="cdCardDelete"
                                    title="Remove countdown"
                                    onClick={() => handleDelete(c.id)}
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="cdCardDate">
                                {new Date(c.examDateTime).toLocaleString(
                                    undefined,
                                    {
                                        weekday: "short",
                                        month: "short",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    }
                                )}
                            </div>

                            <div className="cdCardTimer">
                                {formatCountdown(tl)}
                            </div>

                            {c.reminderMinutesBefore > 0 && (
                                <div className="cdCardReminder">
                                    🔔 Reminder{" "}
                                    {c.reminderMinutesBefore >= 1440
                                        ? `${c.reminderMinutesBefore / 1440} day(s)`
                                        : c.reminderMinutesBefore >= 60
                                            ? `${c.reminderMinutesBefore / 60} hr(s)`
                                            : `${c.reminderMinutesBefore} min`}{" "}
                                    before
                                    {(c.notifyByDesktop || c.notifyByEmail) && (
                                        <span className="cdCardReminderChannels">
                                            {" · "}
                                            {c.notifyByDesktop && "🖥️"}
                                            {c.notifyByDesktop && c.notifyByEmail && " "}
                                            {c.notifyByEmail && "✉️"}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CountdownPage;
