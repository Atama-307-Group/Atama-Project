import { useMemo, useState, useEffect, useRef } from "react";
import { getGoal, updateGoal } from "../api.js"; // adjust path as needed
import { useNavigate } from "react-router-dom";
import "./studyGoal.css";

const DAYS = [
    { key: "M", label: "M" },
    { key: "T", label: "T" },
    { key: "W", label: "W" },
    { key: "Th", label: "Th" },
    { key: "F", label: "F" },
    { key: "Sa", label: "Sa" },
    { key: "Su", label: "Su" },
];

// Map between your UI day keys and Java DayOfWeek enum values
const DAY_KEY_TO_JAVA = {
    M: "MONDAY", T: "TUESDAY", W: "WEDNESDAY",
    Th: "THURSDAY", F: "FRIDAY", Sa: "SATURDAY", Su: "SUNDAY"
};
const JAVA_TO_DAY_KEY = Object.fromEntries(
    Object.entries(DAY_KEY_TO_JAVA).map(([k, v]) => [v, k])
);

const GoalsPage = ({ userId }) => {
    const navigate = useNavigate();
    const [selectedDays, setSelectedDays] = useState(["M", "T", "W", "Th", "F", "Sa", "Su"]);
    const [minutesPerDay, setMinutesPerDay] = useState(15);

    // Edit mode + draft settings (separate per card)
    const [isEditingSchedule, setIsEditingSchedule] = useState(false);
    const [draftDays, setDraftDays] = useState(selectedDays);

    const [isEditingGoal, setIsEditingGoal] = useState(false);
    const [draftMinutes, setDraftMinutes] = useState(minutesPerDay);

    // Notification preferences
    const [notifyDesktop, setNotifyDesktop] = useState(false);
    const [notifyEmail, setNotifyEmail] = useState(false);
    const [notifTime, setNotifTime] = useState("09:00");

    const [isEditingNotif, setIsEditingNotif] = useState(false);
    const [draftNotifyDesktop, setDraftNotifyDesktop] = useState(false);
    const [draftNotifyEmail, setDraftNotifyEmail] = useState(false);
    const [draftNotifTime, setDraftNotifTime] = useState("09:00");

    // Optional progress preview
    const [progress, setProgress] = useState(0);

    // Track when a save is in flight so polls don't overwrite fresh local state
    const pendingSaveRef = useRef(false);

    // 5..60 by 5
    const options = useMemo(() => {
        const arr = [];
        for (let m = 5; m <= 60; m += 5) arr.push(m);
        return arr;
    }, []);

    // Effective values: each card chooses draft vs saved independently
    const effectiveDays = isEditingSchedule ? draftDays : selectedDays;
    const effectiveMinutes = isEditingGoal ? draftMinutes : minutesPerDay;

    const weeklyTotal = useMemo(() => {
        return effectiveDays.length * effectiveMinutes;
    }, [effectiveDays, effectiveMinutes]);

    const percent = useMemo(() => {
        const target = effectiveMinutes || 0;
        if (target <= 0) return 0;
        return Math.min(100, (progress / target) * 100);
    }, [progress, effectiveMinutes]);

    const goalMet = percent >= 100;

    useEffect(() => {
        if (!userId) return;

        const loadGoal = () => {
            getGoal(userId).then(goal => {
                // Only overwrite goal settings if there's no pending save in flight.
                // This prevents a stale poll response from clobbering a goal the
                // user just changed (race condition: save fires, poll returns old
                // value before the backend has committed the update).
                if (!pendingSaveRef.current) {
                    if (goal.selectedDaysOfWeek) {
                        setSelectedDays(goal.selectedDaysOfWeek.map(d => JAVA_TO_DAY_KEY[d]).filter(Boolean));
                    }
                    if (goal.minutesPerDay) {
                        setMinutesPerDay(goal.minutesPerDay);
                    }
                    setNotifyDesktop(!!goal.notifyByDesktop);
                    setNotifyEmail(!!goal.notifyByEmail);
                    if (goal.notificationTime) {
                        // notificationTime comes as "HH:MM:SS" or "HH:MM" from backend
                        setNotifTime(goal.notificationTime.substring(0, 5));
                    }
                }
                // Always update progress — this is the value we want live
                if (goal.totalStudyMinutes !== undefined) {
                    setProgress(goal.totalStudyMinutes);
                }
            }).catch(console.error);
        };

        loadGoal();

        // Then poll every 60 seconds to keep progress bar updated
        const interval = setInterval(loadGoal, 60000);
        return () => clearInterval(interval);
    }, [userId]);
    function toggleDay(dayKey) {
        if (!isEditingSchedule) return;

        setDraftDays((prev) => {
            const has = prev.includes(dayKey);
            if (has) return prev.filter((d) => d !== dayKey);
            return [...prev, dayKey];
        });
    }

    // Schedule card actions
    function startEditSchedule() {
        setDraftDays(selectedDays);
        setIsEditingSchedule(true);
    }

    function cancelEditSchedule() {
        setDraftDays(selectedDays);
        setIsEditingSchedule(false);
    }

    async function persistGoal(days, minutes, extraFields = {}) {
        if (!userId) return;
        pendingSaveRef.current = true;
        try {
            await updateGoal(userId, {
                selectedDaysOfWeek: days.map(d => DAY_KEY_TO_JAVA[d]),
                minutesPerDay: minutes,
                ...extraFields,
            });
        } finally {
            setTimeout(() => { pendingSaveRef.current = false; }, 3000);
        }
    }

    function saveEditSchedule() {
        if (draftDays.length === 0) return;
        setSelectedDays(draftDays);
        setIsEditingSchedule(false);
        persistGoal(draftDays, minutesPerDay);
    }


    // Goal card actions
    function startEditGoal() {
        setDraftMinutes(minutesPerDay);
        setIsEditingGoal(true);
    }

    function cancelEditGoal() {
        setDraftMinutes(minutesPerDay);
        setIsEditingGoal(false);
    }

    function saveEditGoal() {
        setMinutesPerDay(draftMinutes);
        setIsEditingGoal(false);
        persistGoal(selectedDays, draftMinutes);
    }


    return (
        <div className="goalPage">

            <button
                type="button"
                className="backBtn"
                onClick={() => navigate('/')}
                style={{
                    alignSelf: 'flex-start',
                    marginBottom: '8px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1.5rem',
                    color: '#2f3e3b',
                    padding: '4px 8px',
                }}
            >
                ← Back
            </button>

            <h1>Study Schedule and Goal</h1>

            <button
                type="button"
                className="goalBtnPrimary"
                onClick={() => navigate('/countdowns')}
                style={{ marginBottom: '20px', padding: '12px 24px', fontSize: '1rem' }}
            >
                📅 View Exam Countdowns
            </button>

            <div className="stack">
                {/* Card 1: Study Schedule */}
                <div className="card">
                    <div className="sectionTitle">Study Schedule</div>

                    <div className="section">
                        <div className="dayRow" role="group" aria-label="Select study days">
                            {DAYS.map((d) => {
                                const active = effectiveDays.includes(d.key);
                                return (
                                    <button
                                        key={d.key}
                                        type="button"
                                        className={`dayBtn ${active ? "active" : ""}`}
                                        onClick={() => toggleDay(d.key)}
                                        aria-pressed={active}
                                        disabled={!isEditingSchedule}
                                        title={isEditingSchedule ? "Toggle day" : "Click Edit to change"}
                                    >
                                        {d.label}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="hint">
                            Selected:{" "}
                            {effectiveDays.length === 0
                                ? "None"
                                : DAYS.filter((d) => effectiveDays.includes(d.key))
                                    .map((d) => d.label)
                                    .join(" ")}
                        </div>
                    </div>

                    {/* Schedule buttons */}
                    <div className="bottomActions">
                        {!isEditingSchedule ? (
                            <button type="button" className="goalBtnPrimary" onClick={startEditSchedule}>
                                Edit
                            </button>
                        ) : (
                            <>
                                <button
                                    type="button"
                                    className="goalBtnPrimary"
                                    onClick={saveEditSchedule}
                                    disabled={draftDays.length === 0}
                                    title={draftDays.length === 0 ? "Select at least one day" : "Save changes"}
                                >
                                    Save
                                </button>
                                <button type="button" className="goalBtnSecondary" onClick={cancelEditSchedule}>
                                    Cancel
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Card 2: Study Goal */}
                <div className="card">
                    <div className="sectionTitle">Study Goal</div>

                    <div className="section">
                        <div className="fieldRow">
                            <label className="fieldLabel" htmlFor="minutesSelect">
                                Time per study day:
                            </label>

                            <select
                                id="minutesSelect"
                                className="goalSelect"
                                value={effectiveMinutes}
                                onChange={(e) => isEditingGoal && setDraftMinutes(Number(e.target.value))}
                                disabled={!isEditingGoal}
                                title={isEditingGoal ? "Change minutes" : "Click Edit to change"}
                            >
                                {options.map((m) => (
                                    <option key={m} value={m}>
                                        {m} min
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="summary">
                            Weekly target: <strong>{weeklyTotal} minutes</strong>
                            {effectiveDays.length === 0 ? <span className="summaryWarn"> (select at least 1 day)</span> : null}
                        </div>
                    </div>

                    {/* Progress */}
                    <div className="section">
                        <div className="progressRow">
                            <span>
                                {progress} / {effectiveMinutes} min (today)
                            </span>
                            <span>{Math.round(percent)}%</span>
                        </div>

                        <div className="bar">
                            <div className={`fill ${goalMet ? "fill--complete" : ""}`} style={{ width: `${percent}%` }} />
                        </div>

                        {goalMet && (
                            <div className="goalMetMessage" role="status" aria-live="polite">
                                🎉 Goal reached! Great work today!
                            </div>
                        )}
                    </div>

                    {/* Goal buttons */}
                    <div className="bottomActions">
                        {!isEditingGoal ? (
                            <button type="button" className="goalBtnPrimary" onClick={startEditGoal}>
                                Edit
                            </button>
                        ) : (
                            <>
                                <button type="button" className="goalBtnPrimary" onClick={saveEditGoal}>
                                    Save
                                </button>
                                <button type="button" className="goalBtnSecondary" onClick={cancelEditGoal}>
                                    Cancel
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Card 3: Notifications */}
                <div className="card">
                    <div className="sectionTitle">Study Reminders</div>

                    <div className="section">
                        <div className="notifToggleRow">
                            <label className="notifToggleLabel">
                                <span className="notifToggleIcon">🖥️</span> Desktop notifications
                                <label className="toggleSwitch">
                                    <input
                                        type="checkbox"
                                        checked={isEditingNotif ? draftNotifyDesktop : notifyDesktop}
                                        onChange={(e) => isEditingNotif && setDraftNotifyDesktop(e.target.checked)}
                                        disabled={!isEditingNotif}
                                    />
                                    <span className="toggleSlider" />
                                </label>
                            </label>
                        </div>

                        <div className="notifToggleRow">
                            <label className="notifToggleLabel">
                                <span className="notifToggleIcon">✉️</span> Email notifications
                                <label className="toggleSwitch">
                                    <input
                                        type="checkbox"
                                        checked={isEditingNotif ? draftNotifyEmail : notifyEmail}
                                        onChange={(e) => isEditingNotif && setDraftNotifyEmail(e.target.checked)}
                                        disabled={!isEditingNotif}
                                    />
                                    <span className="toggleSlider" />
                                </label>
                            </label>
                        </div>

                        <div className="fieldRow" style={{ marginTop: 14 }}>
                            <label className="fieldLabel" htmlFor="notifTimeInput">
                                Reminder time:
                            </label>
                            <input
                                id="notifTimeInput"
                                type="time"
                                className="goalSelect"
                                value={isEditingNotif ? draftNotifTime : notifTime}
                                onChange={(e) => isEditingNotif && setDraftNotifTime(e.target.value)}
                                disabled={!isEditingNotif}
                                title={isEditingNotif ? "Set reminder time" : "Click Edit to change"}
                            />
                        </div>

                        {(isEditingNotif ? (draftNotifyDesktop || draftNotifyEmail) : (notifyDesktop || notifyEmail)) && (
                            <div className="summary" style={{ marginTop: 10 }}>
                                Reminder at <strong>{isEditingNotif ? draftNotifTime : notifTime}</strong> via{" "}
                                {(() => {
                                    const d = isEditingNotif ? draftNotifyDesktop : notifyDesktop;
                                    const e = isEditingNotif ? draftNotifyEmail : notifyEmail;
                                    if (d && e) return "desktop & email";
                                    if (d) return "desktop";
                                    return "email";
                                })()}
                            </div>
                        )}
                    </div>

                    <div className="bottomActions">
                        {!isEditingNotif ? (
                            <button type="button" className="goalBtnPrimary" onClick={() => {
                                setDraftNotifyDesktop(notifyDesktop);
                                setDraftNotifyEmail(notifyEmail);
                                setDraftNotifTime(notifTime);
                                setIsEditingNotif(true);
                            }}>Edit</button>
                        ) : (
                            <>
                                <button type="button" className="goalBtnPrimary" onClick={() => {
                                    setNotifyDesktop(draftNotifyDesktop);
                                    setNotifyEmail(draftNotifyEmail);
                                    setNotifTime(draftNotifTime);
                                    setIsEditingNotif(false);
                                    persistGoal(selectedDays, minutesPerDay, {
                                        notifyByDesktop: draftNotifyDesktop,
                                        notifyByEmail: draftNotifyEmail,
                                        notificationTime: draftNotifTime + ":00",
                                    });
                                }}>Save</button>
                                <button type="button" className="goalBtnSecondary" onClick={() => {
                                    setDraftNotifyDesktop(notifyDesktop);
                                    setDraftNotifyEmail(notifyEmail);
                                    setDraftNotifTime(notifTime);
                                    setIsEditingNotif(false);
                                }}>Cancel</button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
export default GoalsPage;
