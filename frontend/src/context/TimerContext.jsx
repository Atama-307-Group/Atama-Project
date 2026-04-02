import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const TimerContext = createContext();

export const useTimer = () => {
    const context = useContext(TimerContext);
    if (!context) {
        throw new Error('useTimer must be used within a TimerProvider');
    }
    return context;
};

export const TimerProvider = ({ children }) => {
    const [studyDuration, setStudyDuration] = useState(() => {
        const saved = localStorage.getItem('timerStudyDuration');
        return saved ? parseInt(saved, 10) : 25 * 60; // default 25 minutes
    });

    const [breakDuration, setBreakDuration] = useState(() => {
        const saved = localStorage.getItem('timerBreakDuration');
        return saved ? parseInt(saved, 10) : 5 * 60; // default 5 minutes
    });

    const [isStudyMode, setIsStudyMode] = useState(() => {
        const saved = localStorage.getItem('timerIsStudyMode');
        return saved ? JSON.parse(saved) : true;
    });

    const [timeRemaining, setTimeRemaining] = useState(() => {
        const saved = localStorage.getItem('timerTimeRemaining');
        if (saved) return parseInt(saved, 10);
        const studySaved = localStorage.getItem('timerStudyDuration');
        return studySaved ? parseInt(studySaved, 10) : 25 * 60;
    });

    const [isRunning, setIsRunning] = useState(false);
    const [isPopupOpen, setIsPopupOpen] = useState(false);

    const intervalRef = useRef(null);

    // Save state to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('timerIsStudyMode', JSON.stringify(isStudyMode));
    }, [isStudyMode]);

    useEffect(() => {
        localStorage.setItem('timerTimeRemaining', timeRemaining.toString());
    }, [timeRemaining]);

    useEffect(() => {
        localStorage.setItem('timerStudyDuration', studyDuration.toString());
    }, [studyDuration]);

    useEffect(() => {
        localStorage.setItem('timerBreakDuration', breakDuration.toString());
    }, [breakDuration]);

    // Handle timer countdown
    useEffect(() => {
        if (isRunning && timeRemaining > 0) {
            intervalRef.current = setInterval(() => {
                setTimeRemaining((prev) => {
                    if (prev <= 1) {
                        // Timer finished, switch modes
                        setIsRunning(false);
                        const nextMode = !isStudyMode;
                        setIsStudyMode(nextMode);
                        return nextMode ? studyDuration : breakDuration;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isRunning, timeRemaining, isStudyMode, studyDuration, breakDuration]);

    const startTimer = () => {
        setIsRunning(true);
    };

    const pauseTimer = () => {
        setIsRunning(false);
    };

    const resetTimer = () => {
        setIsRunning(false);
        setTimeRemaining(isStudyMode ? studyDuration : breakDuration);
    };

    const toggleMode = () => {
        setIsRunning(false);
        const nextMode = !isStudyMode;
        setIsStudyMode(nextMode);
        setTimeRemaining(nextMode ? studyDuration : breakDuration);
    };

    const updateStudyDuration = (minutes) => {
        const seconds = minutes * 60;
        setStudyDuration(seconds);
        if (isStudyMode) {
            setTimeRemaining(seconds);
            setIsRunning(false);
        }
    };

    const updateBreakDuration = (minutes) => {
        const seconds = minutes * 60;
        setBreakDuration(seconds);
        if (!isStudyMode) {
            setTimeRemaining(seconds);
            setIsRunning(false);
        }
    };

    const openPopup = () => {
        setIsPopupOpen(true);
    };

    const closePopup = () => {
        setIsPopupOpen(false);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const value = {
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
        openPopup,
        closePopup,
        formatTime,
        updateStudyDuration,
        updateBreakDuration,
    };

    return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
};
