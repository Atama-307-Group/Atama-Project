import React, { useState, useRef, useEffect } from 'react';
import { useTimer } from '../context/TimerContext';
import './TimerPopup.css';

const TimerPopup = () => {
    const {
        isStudyMode,
        timeRemaining,
        isRunning,
        isPopupOpen,
        studyDuration,
        breakDuration,
        startTimer,
        pauseTimer,
        resetTimer,
        toggleMode,
        closePopup,
        formatTime,
        updateStudyDuration,
        updateBreakDuration,
    } = useTimer();

    const [position, setPosition] = useState(() => {
        const saved = localStorage.getItem('timerPopupPosition');
        return saved ? JSON.parse(saved) : { x: 100, y: 100 };
    });

    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const popupRef = useRef(null);

    useEffect(() => {
        localStorage.setItem('timerPopupPosition', JSON.stringify(position));
    }, [position]);

    const handleMouseDown = (e) => {
        if (e.target.closest('.timer-popup-controls')) return;
        
        setIsDragging(true);
        const rect = popupRef.current.getBoundingClientRect();
        setDragOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        });
    };

    const handleMouseMove = (e) => {
        if (isDragging) {
            setPosition({
                x: e.clientX - dragOffset.x,
                y: e.clientY - dragOffset.y,
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        } else {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragOffset]);

    if (!isPopupOpen) return null;

    return (
        <div
            ref={popupRef}
            className={`timer-popup ${isStudyMode ? 'study-mode' : 'break-mode'}`}
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
            }}
            onMouseDown={handleMouseDown}
        >
            <div className="timer-popup-header">
                <span className="timer-popup-title">
                    {isStudyMode ? 'Study Time' : 'Break Time'}
                </span>
                <button className="timer-popup-close" onClick={closePopup}>
                    ×
                </button>
            </div>

            <div className="timer-popup-display">
                <div className="timer-popup-time">{formatTime(timeRemaining)}</div>
            </div>

            <div className="timer-popup-settings">
                <div className="timer-setting">
                    <label>Study Duration (min):</label>
                    <input
                        type="number"
                        min="1"
                        max="120"
                        value={Math.floor(studyDuration / 60)}
                        onChange={(e) => updateStudyDuration(parseInt(e.target.value) || 25)}
                        disabled={isRunning}
                    />
                </div>
                <div className="timer-setting">
                    <label>Break Duration (min):</label>
                    <input
                        type="number"
                        min="1"
                        max="60"
                        value={Math.floor(breakDuration / 60)}
                        onChange={(e) => updateBreakDuration(parseInt(e.target.value) || 5)}
                        disabled={isRunning}
                    />
                </div>
            </div>

            <div className="timer-popup-controls">
                <button
                    className="timer-btn timer-btn-primary"
                    onClick={isRunning ? pauseTimer : startTimer}
                >
                    {isRunning ? 'Pause' : 'Start'}
                </button>
                <button className="timer-btn timer-btn-secondary" onClick={resetTimer}>
                    Reset
                </button>
                <button className="timer-btn timer-btn-secondary" onClick={toggleMode}>
                    Switch to {isStudyMode ? 'Break' : 'Study'}
                </button>
            </div>
        </div>
    );
};

export default TimerPopup;
