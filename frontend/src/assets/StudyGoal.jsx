import { useMemo, useState } from "react";
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

export default function StudyGoal() {
    // Saved (committed) settings
    const [selectedDays, setSelectedDays] = useState(["M", "T", "W", "Th", "F", "Sa", "Su"]);
    const [minutesPerDay, setMinutesPerDay] = useState(15);

    // Edit mode + draft settings (separate per card)
    const [isEditingSchedule, setIsEditingSchedule] = useState(false);
    const [draftDays, setDraftDays] = useState(selectedDays);

    const [isEditingGoal, setIsEditingGoal] = useState(false);
    const [draftMinutes, setDraftMinutes] = useState(minutesPerDay);

    // Optional progress preview
    const [progress, setProgress] = useState(0);

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

    function saveEditSchedule() {
        if (draftDays.length === 0) return;
        setSelectedDays(draftDays);
        setIsEditingSchedule(false);
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
    }

    return (
        <div className="goalPage">
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
                            <div className="fill" style={{ width: `${percent}%` }} />
                        </div>
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
            </div>
        </div>
    );
}