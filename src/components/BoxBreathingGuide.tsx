import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, ExternalLink, Sparkles, Heart } from 'lucide-react';
import { playBreathTone } from '../utils/sound';

type BreathPhase = 'inhale' | 'hold1' | 'exhale' | 'hold2';

interface PhaseConfig {
  name: string;
  instruction: string;
  duration: number; // in seconds
  color: string;
  accent: string;
  pitch: 'high' | 'mid' | 'low';
}

const PHASES: Record<BreathPhase, PhaseConfig> = {
  inhale: {
    name: 'Breathe In',
    instruction: 'Slowly inhale deep into your belly through your nose',
    duration: 4,
    color: 'from-cyan-400 to-teal-500',
    accent: '#06b6d4',
    pitch: 'low',
  },
  hold1: {
    name: 'Hold Gently',
    instruction: 'Keep the breath still and soften your shoulders',
    duration: 4,
    color: 'from-teal-500 to-emerald-500',
    accent: '#10b981',
    pitch: 'mid',
  },
  exhale: {
    name: 'Slowly Exhale',
    instruction: 'Release all the air out smoothly through your mouth',
    duration: 4,
    color: 'from-amber-400 to-orange-500',
    accent: '#f59e0b',
    pitch: 'mid',
  },
  hold2: {
    name: 'Rest & Pause',
    instruction: 'Feel empty, calm, and grounded before the next cycle',
    duration: 4,
    color: 'from-indigo-400 to-purple-500',
    accent: '#8b5cf6',
    pitch: 'high',
  },
};

const PHASE_ORDER: BreathPhase[] = ['inhale', 'hold1', 'exhale', 'hold2'];

export const BoxBreathingGuide: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [phaseSecondsLeft, setPhaseSecondsLeft] = useState(4);
  const [completedCycles, setCompletedCycles] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const currentPhaseKey = PHASE_ORDER[currentPhaseIndex];
  const phaseConfig = PHASES[currentPhaseKey];

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive) {
      interval = setInterval(() => {
        setPhaseSecondsLeft((prev) => {
          if (prev <= 1) {
            // Next phase
            const nextIdx = (currentPhaseIndex + 1) % 4;
            setCurrentPhaseIndex(nextIdx);
            if (nextIdx === 0) {
              setCompletedCycles((c) => c + 1);
            }
            const nextPhaseKey = PHASE_ORDER[nextIdx];
            if (soundEnabled) {
              playBreathTone(PHASES[nextPhaseKey].pitch);
            }
            return 4;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, currentPhaseIndex, soundEnabled]);

  const togglePractice = () => {
    if (!isActive && soundEnabled) {
      playBreathTone('low');
    }
    setIsActive(!isActive);
  };

  const handleReset = () => {
    setIsActive(false);
    setCurrentPhaseIndex(0);
    setPhaseSecondsLeft(4);
  };

  // Calculate box perimeter line highlight
  // 0: top (inhale), 1: right (hold1), 2: bottom (exhale), 3: left (hold2)
  const progressPercent = ((4 - phaseSecondsLeft + 1) / 4) * 100;

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
      {/* Background soft ambient glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full blur-3xl opacity-20 pointer-events-none transition-all duration-1000"
        style={{ backgroundColor: phaseConfig.accent }}
      />

      <div className="relative z-10">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/30">
              Activity 2 • Physiological (Ph) Coping Strategy
            </span>
            <span className="text-xs text-slate-400">Target: 2 Minutes</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition text-xs flex items-center gap-1.5"
              title={soundEnabled ? 'Mute soothing audio cues' : 'Enable audio cues'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-teal-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
              <span className="hidden sm:inline">{soundEnabled ? 'Chime ON' : 'Muted'}</span>
            </button>
            <span className="text-xs bg-slate-800/90 text-amber-300 px-3 py-1.5 rounded-xl font-medium border border-slate-700">
              Completed: <strong className="text-white font-bold">{completedCycles}</strong> {completedCycles === 1 ? 'cycle' : 'cycles'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Left Column: Visual 4-4-4-4 Box Breathing Guide */}
          <div className="flex flex-col items-center justify-center p-4">
            <div className="relative w-64 h-64 flex items-center justify-center">
              {/* Outer Square Track */}
              <div className="absolute inset-2 border-2 border-slate-800 rounded-3xl" />

              {/* 4 sides representation */}
              {/* Top: Inhale */}
              <div
                className={`absolute top-2 left-6 right-6 h-1.5 rounded-full transition-all duration-500 ${
                  currentPhaseIndex === 0 ? 'bg-cyan-400 shadow-[0_0_12px_#22d3ee]' : 'bg-slate-800'
                }`}
              />
              {/* Right: Hold */}
              <div
                className={`absolute top-6 bottom-6 right-2 w-1.5 rounded-full transition-all duration-500 ${
                  currentPhaseIndex === 1 ? 'bg-emerald-400 shadow-[0_0_12px_#34d399]' : 'bg-slate-800'
                }`}
              />
              {/* Bottom: Exhale */}
              <div
                className={`absolute bottom-2 left-6 right-6 h-1.5 rounded-full transition-all duration-500 ${
                  currentPhaseIndex === 2 ? 'bg-amber-400 shadow-[0_0_12px_#fbbf24]' : 'bg-slate-800'
                }`}
              />
              {/* Left: Hold */}
              <div
                className={`absolute top-6 bottom-6 left-2 w-1.5 rounded-full transition-all duration-500 ${
                  currentPhaseIndex === 3 ? 'bg-purple-400 shadow-[0_0_12px_#a855f7]' : 'bg-slate-800'
                }`}
              />

              {/* Central Pulsing Sphere */}
              <div
                className={`w-36 h-36 rounded-full flex flex-col items-center justify-center text-center p-3 transition-transform duration-1000 shadow-2xl bg-gradient-to-tr ${phaseConfig.color} ${
                  isActive && currentPhaseKey === 'inhale'
                    ? 'scale-110'
                    : isActive && currentPhaseKey === 'exhale'
                    ? 'scale-90 opacity-90'
                    : 'scale-100'
                }`}
              >
                <span className="text-xs uppercase font-extrabold tracking-wider text-slate-950 opacity-90">
                  {phaseConfig.name}
                </span>
                <span className="text-4xl font-black text-slate-950 font-mono my-0.5">
                  {phaseSecondsLeft}s
                </span>
                <span className="text-[10px] font-bold text-slate-900/80">
                  4-4-4-4 Pace
                </span>
              </div>
            </div>

            {/* Stage Indicators */}
            <div className="grid grid-cols-4 gap-2 w-full max-w-xs mt-3 text-center">
              {PHASE_ORDER.map((phaseKey, idx) => {
                const isCurrent = currentPhaseIndex === idx;
                return (
                  <div
                    key={phaseKey}
                    className={`py-1.5 px-1 rounded-lg text-[11px] font-semibold transition ${
                      isCurrent
                        ? 'bg-slate-800 text-amber-300 ring-1 ring-amber-400/50'
                        : 'text-slate-500 bg-slate-900/50'
                    }`}
                  >
                    {PHASES[phaseKey].name.split(' ')[0]}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Instructions & Coping Rationale */}
          <div className="space-y-4">
            <div className="bg-slate-800/60 rounded-2xl p-5 border border-slate-700/80">
              <div className="flex items-center gap-2 text-amber-400 mb-1.5 font-semibold text-sm">
                <Sparkles className="w-4 h-4" />
                Current Action:
              </div>
              <h4 className="text-xl font-bold text-white mb-2">{phaseConfig.name}</h4>
              <p className="text-slate-300 text-sm leading-relaxed">
                {phaseConfig.instruction}
              </p>
            </div>

            <div className="bg-slate-800/40 rounded-2xl p-4 border border-slate-800 text-xs text-slate-300 space-y-2">
              <div className="font-semibold text-teal-300 flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5" />
                Why Box Breathing works in Term 4:
              </div>
              <p className="leading-relaxed text-slate-300">
                When you face overwhelming exam deadlines, unexpected marks, or friend conflicts, your nervous system triggers fight-or-flight. 
                Even <strong>2 minutes of box breathing</strong> slows your heart rate, sends oxygen to your thinking brain, and resets your calm focus.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={togglePractice}
                className={`min-h-[48px] px-6 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 shadow-lg transition active:scale-95 ${
                  isActive
                    ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40 hover:bg-amber-400/30'
                    : 'bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-950 hover:opacity-95 shadow-teal-500/20'
                }`}
              >
                {isActive ? (
                  <>
                    <Pause className="w-4 h-4 fill-current" /> Pause Practice
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" /> {completedCycles > 0 ? 'Resume Breathing' : 'Start 2-Min Box Breathing'}
                  </>
                )}
              </button>

              <button
                onClick={handleReset}
                className="min-h-[48px] px-4 py-3 rounded-2xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-sm font-medium flex items-center gap-1.5 transition active:scale-95"
              >
                <RotateCcw className="w-4 h-4" /> Reset
              </button>

              {/* Optional external backup link for teachers if school network permits YouTube */}
              <a
                href="https://youtu.be/tEmt1Znux58?si=39HsxAicfCpY9grj&t=32"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-slate-400 hover:text-slate-200 underline flex items-center gap-1 ml-auto"
                title="Open original video link from slide 9 if not blocked by school network"
              >
                <span>Slide Video Link</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
