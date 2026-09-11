import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Bell, Plus, Minus, Volume2, VolumeX } from 'lucide-react';
import { playChimeSound } from '../utils/sound';

interface ClassroomTimerProps {
  initialMinutes?: number;
  label?: string;
  onComplete?: () => void;
  isFloating?: boolean;
}

export const ClassroomTimer: React.FC<ClassroomTimerProps> = ({
  initialMinutes = 5,
  label = 'Classroom Activity Timer',
  onComplete,
  isFloating = false,
}) => {
  const [totalSeconds, setTotalSeconds] = useState(initialMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setTotalSeconds(initialMinutes * 60);
    setIsRunning(false);
  }, [initialMinutes]);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTotalSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsRunning(false);
            if (soundEnabled) {
              playChimeSound();
            }
            if (onComplete) onComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, soundEnabled, onComplete]);

  const toggleRun = () => setIsRunning((prev) => !prev);
  const resetTimer = (mins: number = initialMinutes) => {
    setIsRunning(false);
    setTotalSeconds(mins * 60);
  };

  const adjustTime = (deltaSeconds: number) => {
    setTotalSeconds((prev) => Math.max(0, prev + deltaSeconds));
  };

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const isExpired = totalSeconds === 0;

  const presets = [
    { label: '5m Check-in', mins: 5 },
    { label: '2m Breathing', mins: 2 },
    { label: '20m Group Work', mins: 20 },
    { label: '10m Card Pair', mins: 10 },
    { label: '3m Reflection', mins: 3 },
  ];

  if (isFloating) {
    return (
      <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md text-white px-3 py-1.5 rounded-full shadow-lg border border-slate-700 select-none">
        <button
          onClick={toggleRun}
          className="p-1 rounded-full hover:bg-slate-700 transition min-w-[32px] min-h-[32px] flex items-center justify-center text-amber-400"
          title={isRunning ? 'Pause' : 'Start'}
        >
          {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-amber-400" />}
        </button>
        <span className={`font-mono text-base font-bold tracking-wider ${isExpired ? 'text-rose-400 animate-pulse' : 'text-amber-300'}`}>
          {formattedTime}
        </span>
        <button
          onClick={() => resetTimer(initialMinutes)}
          className="p-1 text-slate-400 hover:text-white transition"
          title="Reset"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 w-full select-none">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
          <h3 className="text-sm font-semibold tracking-wide text-slate-700 uppercase">
            {label}
          </h3>
        </div>
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800 transition px-2 py-1 rounded-md hover:bg-slate-100"
          title={soundEnabled ? 'Chime sound on' : 'Chime sound muted'}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          <span className="hidden sm:inline">{soundEnabled ? 'Chime ON' : 'Muted'}</span>
        </button>
      </div>

      {/* Main Digital Clock Face */}
      <div className="flex flex-col items-center justify-center py-3">
        <div
          className={`font-mono text-5xl sm:text-6xl font-black tracking-tight ${
            isExpired ? 'text-rose-600 animate-pulse' : isRunning ? 'text-slate-900' : 'text-slate-700'
          }`}
        >
          {formattedTime}
        </div>
        {isExpired && (
          <p className="text-rose-600 text-sm font-medium mt-1 animate-bounce">
            Time is up! Great effort, class!
          </p>
        )}
      </div>

      {/* Control Buttons */}
      <div className="flex items-center justify-center gap-2 mt-2">
        <button
          onClick={() => adjustTime(-60)}
          className="min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-medium text-sm flex items-center gap-1 transition active:scale-95"
          title="-1 Minute"
        >
          <Minus className="w-4 h-4" /> 1m
        </button>

        <button
          onClick={toggleRun}
          className={`min-h-[44px] px-6 py-2.5 rounded-xl font-semibold text-base flex items-center gap-2 shadow-sm transition active:scale-95 ${
            isRunning
              ? 'bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300'
              : 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-amber-200'
          }`}
        >
          {isRunning ? (
            <>
              <Pause className="w-5 h-5 fill-current" /> Pause
            </>
          ) : (
            <>
              <Play className="w-5 h-5 fill-current" /> Start Timer
            </>
          )}
        </button>

        <button
          onClick={() => resetTimer(initialMinutes)}
          className="min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-medium text-sm flex items-center gap-1 transition active:scale-95"
          title="Reset"
        >
          <RotateCcw className="w-4 h-4" /> Reset
        </button>

        <button
          onClick={() => adjustTime(60)}
          className="min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-medium text-sm flex items-center gap-1 transition active:scale-95"
          title="+1 Minute"
        >
          <Plus className="w-4 h-4" /> 1m
        </button>
      </div>

      {/* Quick Activity Presets */}
      <div className="mt-4 pt-3 border-t border-slate-100">
        <p className="text-xs text-slate-400 mb-2 font-medium">Lesson Activity Presets:</p>
        <div className="flex flex-wrap gap-1.5">
          {presets.map((preset) => (
            <button
              key={preset.label}
              onClick={() => resetTimer(preset.mins)}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-amber-100 hover:text-amber-900 text-slate-600 font-medium transition min-h-[36px]"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
