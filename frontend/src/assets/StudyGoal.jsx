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

    // Edit mode + draft settings
    const [isEditing, setIsEditing] = useState(false);
    const [draftDays, setDraftDays] = useState(selectedDays);
    const [draftMinutes, setDraftMinutes] = useState(minutesPerDay);

    // Optional progress preview
    const [progress, setProgress] = useState(0);

    // 5..60 by 5
    const options = useMemo(() => {
        const arr = [];
        for (let m = 5; m <= 60; m += 5) arr.push(m);
        return arr;
    }, []);

    // What the UI should display (draft in edit mode, saved otherwise)
    const effectiveDays = isEditing ? draftDays : selectedDays;
    const effectiveMinutes = isEditing ? draftMinutes : minutesPerDay;

    const weeklyTotal = useMemo(() => {
        return effectiveDays.length * effectiveMinutes;
    }, [effectiveDays, effectiveMinutes]);

    const percent = useMemo(() => {
        const target = effectiveMinutes || 0;
        if (target <= 0) return 0;
        return Math.min(100, (progress / target) * 100);
    }, [progress, effectiveMinutes]);

    function toggleDay(dayKey) {
        if (!isEditing) return;

        setDraftDays((prev) => {
            const has = prev.includes(dayKey);
            if (has) return prev.filter((d) => d !== dayKey);
            return [...prev, dayKey];
        });
    }

    function startEdit() {
        setDraftDays(selectedDays);
        setDraftMinutes(minutesPerDay);
        setIsEditing(true);
    }

    function cancelEdit() {
        setDraftDays(selectedDays);
        setDraftMinutes(minutesPerDay);
        setIsEditing(false);
    }

    function saveEdit() {
        // Optional guard: require at least 1 day
        if (draftDays.length === 0) return;

        setSelectedDays(draftDays);
        setMinutesPerDay(draftMinutes);
        setIsEditing(false);
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
                                        disabled={!isEditing}
                                        title={isEditing ? "Toggle day" : "Click Edit to change"}
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

                        {/* TODO: later - notification time selector */}
                        {/* <div className="hint">TODO: you will receive an email notif on these days at this time</div> */}
                    </div>

                    {/* Bottom buttons */}
                    <div className="bottomActions">
                        {!isEditing ? (
                            <button type="button" className="goalBtnPrimary" onClick={startEdit}>
                                Edit
                            </button>
                        ) : (
                            <>
                                <button
                                    type="button"
                                    className="goalBtnPrimary"
                                    onClick={saveEdit}
                                    disabled={draftDays.length === 0}
                                    title={draftDays.length === 0 ? "Select at least one day" : "Save changes"}
                                >
                                    Save
                                </button>
                                <button type="button" className="goalBtnSecondary" onClick={cancelEdit}>
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
                                onChange={(e) => isEditing && setDraftMinutes(Number(e.target.value))}
                                disabled={!isEditing}
                                title={isEditing ? "Change minutes" : "Click Edit to change"}
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
                            {effectiveDays.length === 0 ? (
                                <span className="summaryWarn"> (select at least 1 day)</span>
                            ) : null}
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
                            <div className="fill" style={{width: `${percent}%`}}/>
                        </div>
                    </div>
                </div>


            </div>
        </div>
    );
}

// TODO Make two edit buttons tbh