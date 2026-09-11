import React from 'react';
import { Clock, Compass, Heart, Users, Shield, Sparkles, Award, QrCode, UserCheck, User } from 'lucide-react';
import { S17Logo } from './S17Logo';
import { ClassroomTimer } from './ClassroomTimer';
import { StudentRosterItem } from '../types';

export type NavTab = 'overview' | 'part1' | 'part2' | 'part3' | 'teacher';

interface HeaderNavProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  showFloatingTimer: boolean;
  onToggleTimer: () => void;
  currentStudent?: StudentRosterItem | null;
  onOpenCheckIn?: () => void;
  isStudentMode?: boolean;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  currentTab,
  onSelectTab,
  showFloatingTimer,
  onToggleTimer,
  currentStudent,
  onOpenCheckIn,
  isStudentMode = false,
}) => {
  const navItems: { id: NavTab; label: string; partNum?: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'part1', label: 'Growth & Sentiments', partNum: 'Part 1' },
    { id: 'part2', label: 'B.A.S.I.C. Ph Coping', partNum: 'Part 2' },
    { id: 'part3', label: 'Finish Well Card', partNum: 'Part 3' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 print:hidden shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & School/Class title */}
          <div
            onClick={() => onSelectTab('overview')}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <S17Logo size={58} showSubtitle={false} className="group-hover:scale-105 transition-transform" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg sm:text-xl text-slate-900 tracking-tight">
                  Secondary 1-7
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full">
                  Term 4 CCE
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                Learning to Learn and Grow Together
              </p>
            </div>
          </div>

          {/* Nav Tabs for iPad / Desktop */}
          <nav className="hidden md:flex items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200">
            {navItems.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-white text-slate-950 shadow-xs ring-1 ring-slate-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  {item.partNum && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-black ${
                        isActive ? 'bg-amber-200 text-slate-950' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {item.partNum}
                    </span>
                  )}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Quick Classroom Utilities & Mode Switches */}
          <div className="flex items-center gap-2">
            {/* Student Identity Chip */}
            {onOpenCheckIn && (
              <button
                onClick={onOpenCheckIn}
                className={`min-h-[44px] px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition ${
                  currentStudent
                    ? 'bg-emerald-50 text-emerald-950 border-emerald-300 hover:bg-emerald-100'
                    : 'bg-amber-50 text-amber-950 border-amber-300 hover:bg-amber-100 animate-pulse'
                }`}
                title={currentStudent ? `Signed in as ${currentStudent.name}. Click to change.` : 'Click to select your name from the class roster'}
              >
                {currentStudent ? (
                  <>
                    <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="hidden lg:inline truncate max-w-[110px]">{currentStudent.name.split(' ')[0]}</span>
                    <span className="lg:hidden text-[11px]">Joined</span>
                  </>
                ) : (
                  <>
                    <User className="w-4 h-4 text-amber-700 shrink-0" />
                    <span className="hidden sm:inline">Select Name</span>
                    <span className="sm:hidden text-[11px]">Check-In</span>
                  </>
                )}
              </button>
            )}

            {/* Teacher Host Mode Button (Only shown if not in student mode) */}
            {!isStudentMode ? (
              <button
                onClick={() => onSelectTab('teacher')}
                className={`min-h-[44px] px-3 sm:px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition active:scale-95 border-2 ${
                  currentTab === 'teacher'
                    ? 'bg-slate-950 text-amber-300 border-slate-900 shadow-xs'
                    : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-950 border-indigo-200'
                }`}
                title="Open Teacher Host Mode: QR Code, Roster & Participation Tracker"
              >
                <QrCode className="w-4 h-4 text-indigo-600" />
                <span className="hidden sm:inline">Teacher Host</span>
                <span className="sm:hidden">Host</span>
              </button>
            ) : (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 select-none">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Participant</span>
              </div>
            )}

            {/* Timer Toggle */}
            <button
              onClick={onToggleTimer}
              className={`min-h-[44px] px-3 sm:px-3.5 py-2 rounded-xl text-xs font-semibold hidden lg:flex items-center gap-1.5 transition active:scale-95 border ${
                showFloatingTimer
                  ? 'bg-amber-400 text-slate-950 border-amber-500 font-bold shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
              title="Toggle Classroom Activity Countdown Timer"
            >
              <Clock className="w-4 h-4 text-amber-600" />
              <span>Timer</span>
            </button>

            {/* Finish Well Card Quick Action */}
            <button
              onClick={() => onSelectTab('part3')}
              className="min-h-[44px] px-3 sm:px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-1.5 transition active:scale-95 shadow-xs border border-amber-500"
              title="Open Finish Well Digital Card"
            >
              <Award className="w-4 h-4 text-slate-950" />
              <span className="hidden sm:inline">Card</span>
            </button>
          </div>
        </div>

        {/* Mobile/iPad Horizontal Nav Row */}
        <div className="flex md:hidden items-center gap-1 py-2 overflow-x-auto border-t border-slate-100 scrollbar-none">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 ${
                  isActive
                    ? 'bg-slate-900 text-amber-300'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {item.partNum && <span className="opacity-75">{item.partNum}:</span>}
                <span>{item.label}</span>
              </button>
            );
          })}
          {!isStudentMode && (
            <button
              onClick={() => onSelectTab('teacher')}
              className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-1 ${
                currentTab === 'teacher'
                  ? 'bg-indigo-950 text-amber-300'
                  : 'bg-indigo-50 text-indigo-900'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Host QR</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
