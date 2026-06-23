import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Flame, Coffee, Sun } from 'lucide-react';
import audioEngine from '../audio/audioEngine';

const Timer = () => {
  const [mode, setMode] = useState('focus'); // focus, shortBreak, longBreak
  const [duration, setDuration] = useState(25 * 60); // in seconds
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef(null);

  // Mode durations configuration
  const MODE_DURATIONS = {
    focus: 25 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60,
  };

  // Synchronize time when mode changes
  const handleModeChange = (newMode) => {
    setIsRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setMode(newMode);
    setDuration(MODE_DURATIONS[newMode]);
    setTimeLeft(MODE_DURATIONS[newMode]);
  };

  // Play/Pause toggle
  const toggleTimer = () => {
    // Make sure click registers key sound
    audioEngine.triggerKeyboardClick();

    if (isRunning) {
      setIsRunning(false);
      if (timerRef.current) clearInterval(timerRef.current);
    } else {
      setIsRunning(true);
      // Initialize audio engine on interaction if not done
      audioEngine.init();
      
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Timer finished!
            setIsRunning(false);
            clearInterval(timerRef.current);
            audioEngine.playTimerChime();
            
            // Switch mode automatically
            if (mode === 'focus') {
              setMode('shortBreak');
              setDuration(MODE_DURATIONS.shortBreak);
              return MODE_DURATIONS.shortBreak;
            } else {
              setMode('focus');
              setDuration(MODE_DURATIONS.focus);
              return MODE_DURATIONS.focus;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  // Reset timer
  const resetTimer = () => {
    audioEngine.triggerKeyboardClick();
    setIsRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(duration);
  };

  // Format time (e.g. 25:00)
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // SVG circular progress calculation
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (timeLeft / duration) * circumference;

  // Custom adjustments (+/- 1 minute)
  const adjustTime = (amount) => {
    audioEngine.triggerKeyboardClick();
    const newTime = Math.max(60, timeLeft + amount * 60);
    setTimeLeft(newTime);
    setDuration(newTime);
  };

  return (
    <div className="timer-panel">
      <div className="timer-modes">
        <button
          className={`mode-btn ${mode === 'focus' ? 'active' : ''}`}
          onClick={() => handleModeChange('focus')}
        >
          <Flame size={14} className="mode-icon" />
          <span>Focus</span>
        </button>
        <button
          className={`mode-btn ${mode === 'shortBreak' ? 'active' : ''}`}
          onClick={() => handleModeChange('shortBreak')}
        >
          <Coffee size={14} className="mode-icon" />
          <span>Short Break</span>
        </button>
        <button
          className={`mode-btn ${mode === 'longBreak' ? 'active' : ''}`}
          onClick={() => handleModeChange('longBreak')}
        >
          <Sun size={14} className="mode-icon" />
          <span>Long Break</span>
        </button>
      </div>

      <div className="timer-display-container">
        {/* SVG Circular Ring */}
        <svg className="progress-ring" width="180" height="180">
          <circle
            className="progress-ring-bg"
            stroke="rgba(255, 255, 255, 0.05)"
            strokeWidth="8"
            fill="transparent"
            r={radius}
            cx="90"
            cy="90"
          />
          <circle
            className={`progress-ring-fg ${mode}`}
            strokeWidth="8"
            fill="transparent"
            r={radius}
            cx="90"
            cy="90"
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: strokeDashoffset,
            }}
          />
        </svg>

        <div className="timer-text-container">
          <span className="time-display">{formatTime(timeLeft)}</span>
          <span className="mode-label">{mode === 'focus' ? 'Stay Focused' : 'Take a Breath'}</span>
        </div>
      </div>

      <div className="timer-time-adjusters">
        <button className="adjust-btn" onClick={() => adjustTime(-1)}>-</button>
        <span className="adjust-label">Modify Time</span>
        <button className="adjust-btn" onClick={() => adjustTime(1)}>+</button>
      </div>

      <div className="timer-controls">
        <button className="control-btn reset" onClick={resetTimer} title="Reset Timer">
          <RotateCcw size={20} />
        </button>
        
        <button 
          className={`control-btn play-pause ${isRunning ? 'running' : ''}`}
          onClick={toggleTimer}
          title={isRunning ? 'Pause' : 'Start'}
        >
          {isRunning ? <Pause size={24} /> : <Play size={24} />}
        </button>
      </div>
    </div>
  );
};

export default Timer;
