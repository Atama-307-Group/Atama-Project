import { useMemo, useState, useEffect, useRef } from "react";
import { getGoal, updateGoal, getStreak } from "../api.js"; // adjust path as needed
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
    const [selectedDays, setSelectedDays] = useState(["M","T","W","Th","F","Sa","Su"]);
    const [minutesPerDay, setMinutesPerDay] = useState(15);

    // Edit mode + draft settings (separate per card)
    const [isEditingSchedule, setIsEditingSchedule] = useState(false);
    const [draftDays, setDraftDays] = useState(selectedDays);

    const [isEditingGoal, setIsEditingGoal] = useState(false);
    const [draftMinutes, setDraftMinutes] = useState(minutesPerDay);

    // Optional progress preview
    const [progress, setProgress] = useState(0);

    // Streak
    const [streak, setStreak] = useState(0);
    const [studyDates, setStudyDates] = useState([]);

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

    const calendarDays = useMemo(() => {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();

        const lastDay = new Date(year, month + 1, 0);

        const days = [];

        for (let i = 1; i <= lastDay.getDate(); i++) {
            const date = new Date(year, month, i)
                .toLocaleDateString("sv-SE")

            days.push({
                day: i,
                studied: studyDates.includes(date)
            });
        }

        return days;
    }, [studyDates]);

    const monthLabel = useMemo(() => {
        const today = new Date();
        return today.toLocaleString("default", {
            month: "long",
            year: "numeric"
        });
    }, []);

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
                }
                // Always update progress — this is the value we want live
                if (goal.totalStudyMinutes !== undefined) {
                    setProgress(goal.totalStudyMinutes);
                }
            }).catch(console.error);
        };

        loadGoal();

        const loadStreak = () => {
            getStreak(userId)
                .then(data => {
                    setStreak(data.currentStreak);
                    setStudyDates(data.studyDates || []);
                })
                .catch(console.error);
        };

        loadStreak();

        // Then poll every 60 seconds to keep progress bar updated
        const interval = setInterval(() => {
            loadGoal();
            loadStreak();
        }, 60000);
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

    async function persistGoal(days, minutes) {
        if (!userId) return;
        pendingSaveRef.current = true;
        try {
            await updateGoal(userId, {
                selectedDaysOfWeek: days.map(d => DAY_KEY_TO_JAVA[d]),
                minutesPerDay: minutes,
            });
        } finally {
            // Clear the flag after a short buffer so any in-flight poll that
            // started just before the save completes doesn't stomp our state
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
                {/* Card 3: Study Streak */}
                <div className="card">
                    <div className="sectionTitle">
                        🔥 Streak: {streak} day{streak !== 1 ? "s" : ""}
                    </div>

                    <div className="calendarHeader">
                        {monthLabel}
                    </div>

                    <div className="calendar">
                        {calendarDays.map((d, i) => (
                            <div
                                key={i}
                                className={`calendarDay ${d.studied ? "studied" : ""}`}
                            >
                                {d.day}
                            </div>
                        ))}
                    </div>

                    <div className="hint">
                        Days highlighted indicate when you studied.
                    </div>
                </div>
            </div>
        </div>
    );
}
export default GoalsPage;
