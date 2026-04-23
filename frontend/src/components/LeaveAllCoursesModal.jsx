import { useState } from "react";

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

const CalendarGrid = ({ year, month, selectedDate, onSelect }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];

    for (let i = 0; i < firstDay; i++) {
        cells.push(<div key={`blank-${i}`} />);
    }

    for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(year, month, d);
        const isPast = date <= today;
        const isSel = selectedDate && date.getTime() === selectedDate.getTime();
        cells.push(
            <button
                key={d}
                className={`calDay ${isPast ? "calDay--disabled" : ""} ${isSel ? "calDay--selected" : ""}`}
                disabled={isPast}
                onClick={() => onSelect(date)}
            >
                {d}
            </button>
        );
    }

    return <div className="calGrid">{cells}</div>;
};

const LeaveAllCoursesModal = ({ leavingAll, scheduledLeaveDate, onConfirm, onCancel }) => {
    const [scheduleEnabled, setScheduleEnabled] = useState(!!scheduledLeaveDate);
    const [scheduleLeaveDate, setScheduleLeaveDate] = useState(scheduledLeaveDate ?? null);
    const [calViewYear, setCalViewYear] = useState(new Date().getFullYear());
    const [calViewMonth, setCalViewMonth] = useState(new Date().getMonth());

    function handlePrevMonth() {
        if (calViewMonth === 0) {
            setCalViewMonth(11);
            setCalViewYear(y => y - 1);
        } else {
            setCalViewMonth(m => m - 1);
        }
    }

    function handleNextMonth() {
        if (calViewMonth === 11) {
            setCalViewMonth(0);
            setCalViewYear(y => y + 1);
        } else {
            setCalViewMonth(m => m + 1);
        }
    }

    function handleToggleSchedule(e) {
        setScheduleEnabled(e.target.checked);
        if (!e.target.checked) setScheduleLeaveDate(null);
    }

    return (
        <div className="modalOverlay" onClick={onCancel}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modalTitle">Leave all courses?</div>
                <p className="modalBody">
                    Are you sure you want to leave all your enrolled courses? You can always re-enroll later.
                </p>

                <div className="scheduleToggleRow">
                    <input
                        type="checkbox"
                        id="scheduleCheck"
                        checked={scheduleEnabled}
                        onChange={handleToggleSchedule}
                    />
                    <label htmlFor="scheduleCheck">Schedule for a future date</label>
                </div>

                {scheduleLeaveDate && (
                    <p className="scheduleSetNote">
                        Currently scheduled for midnight on {scheduleLeaveDate.toLocaleDateString("en-US", {
                            weekday: "long", month: "long", day: "numeric", year: "numeric"
                        })}
                    </p>
                )}

                {scheduleEnabled && (
                    <div className="calendarWrap">
                        <div className="calHeader">
                            <button className="calNavBtn" onClick={handlePrevMonth}>←</button>
                            <span className="calMonthLabel">{MONTHS[calViewMonth]} {calViewYear}</span>
                            <button className="calNavBtn" onClick={handleNextMonth}>→</button>
                        </div>

                        <div className="calDayNames">
                            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => (
                                <span key={d} className="calDayName">{d}</span>
                            ))}
                        </div>

                        <CalendarGrid
                            year={calViewYear}
                            month={calViewMonth}
                            selectedDate={scheduleLeaveDate}
                            onSelect={(date) => { console.log("selected:", date); setScheduleLeaveDate(date); }}

                        />


                    </div>
                )}

                <div className="modalActions">
                    <button className="btn cancelBtn" onClick={onCancel}>
                        Cancel
                    </button>
                    <button
                        className="btn leaveAllConfirmBtn"
                        onClick={() => onConfirm(scheduleLeaveDate)}
                        disabled={leavingAll || (scheduleEnabled && !scheduleLeaveDate)}
                    >
                        {leavingAll
                            ? "Saving..."
                            : scheduleLeaveDate
                            ? "Schedule leave"
                            : "Yes, leave all"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LeaveAllCoursesModal;