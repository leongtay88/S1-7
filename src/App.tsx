/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { HeaderNav, NavTab } from './components/HeaderNav';
import { LessonOverview } from './components/LessonOverview';
import { Part1Sentiments } from './components/Part1Sentiments';
import { Part2BasicPh } from './components/Part2BasicPh';
import { Part3FinishWell } from './components/Part3FinishWell';
import { ClassroomTimer } from './components/ClassroomTimer';
import { TeacherDashboard } from './components/TeacherDashboard';
import { StudentCheckInModal } from './components/StudentCheckInModal';
import { S17Logo } from './components/S17Logo';
import { Heart, Sparkles, ChevronRight, BookOpen, Clock, QrCode } from 'lucide-react';
import { getCurrentStudent, subscribeToSync, isStudentModeActive, initRosterFromUrlOrStorage } from './utils/sessionStore';
import { StudentRosterItem } from './types';

export default function App() {
  const [isStudentMode, setIsStudentMode] = useState<boolean>(isStudentModeActive);

  const [currentTab, setCurrentTab] = useState<NavTab>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (!isStudentModeActive() && (params.get('mode') === 'teacher' || params.get('tab') === 'teacher')) {
        return 'teacher';
      }
    }
    return 'overview';
  });

  const [showFloatingTimer, setShowFloatingTimer] = useState(false);
  const [currentStudent, setCurrentStudentState] = useState<StudentRosterItem | null>(getCurrentStudent);
  const [showCheckInModal, setShowCheckInModal] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('mode') === 'student' || params.get('join') === 'true' || params.has('r') || params.has('roster')) {
        return true;
      }
    }
    return false;
  });

  // Guard against student ever accessing teacher host view
  useEffect(() => {
    if (isStudentMode && currentTab === 'teacher') {
      setCurrentTab('overview');
    }
  }, [isStudentMode, currentTab]);

  // Initialize roster from URL or storage on first mount
  useEffect(() => {
    initRosterFromUrlOrStorage().then(() => {
      // Re-evaluate student identity and mode
      setCurrentStudentState(getCurrentStudent());
      setIsStudentMode(isStudentModeActive());
    });
  }, []);

  // Listen for sync events
  useEffect(() => {
    const unsubscribe = subscribeToSync((action, payload) => {
      if (action === 'STUDENT_CHANGED') {
        setCurrentStudentState(payload as StudentRosterItem);
      } else if (action === 'STUDENT_LOGOUT') {
        setCurrentStudentState(null);
      } else if (action === 'ROSTER_UPDATED') {
        setCurrentStudentState(getCurrentStudent());
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-amber-200">
      {/* Top Application Header */}
      <HeaderNav
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        showFloatingTimer={showFloatingTimer}
        onToggleTimer={() => setShowFloatingTimer((prev) => !prev)}
        currentStudent={currentStudent}
        onOpenCheckIn={() => setShowCheckInModal(true)}
        isStudentMode={isStudentMode}
      />

      {/* Persistent Floating Timer Widget on iPad/Desktop when enabled */}
      {showFloatingTimer && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce-short print:hidden">
          <ClassroomTimer initialMinutes={5} isFloating={true} />
        </div>
      )}

      {/* Student Check-In & Identity Modal */}
      <StudentCheckInModal
        isOpen={showCheckInModal}
        onClose={() => setShowCheckInModal(false)}
        currentStudent={currentStudent}
        onStudentSelected={(student) => setCurrentStudentState(student)}
      />

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {currentTab === 'overview' && <LessonOverview onSelectTab={setCurrentTab} />}
        {currentTab === 'part1' && <Part1Sentiments />}
        {currentTab === 'part2' && <Part2BasicPh />}
        {currentTab === 'part3' && <Part3FinishWell />}
        {currentTab === 'teacher' && !isStudentMode && (
          <TeacherDashboard
            onClose={() => setCurrentTab('overview')}
            onSwitchToStudent={() => setCurrentTab('overview')}
          />
        )}
      </main>

      {/* Breadcrumb / Step Navigation Footer */}
      <div className="bg-white border-t border-slate-200 py-4 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">S1-7 CCE Journey:</span>
            <span className="flex items-center gap-1 font-medium">
              <button
                onClick={() => setCurrentTab('overview')}
                className={`hover:text-slate-900 ${currentTab === 'overview' ? 'text-amber-600 font-bold' : ''}`}
              >
                Overview
              </button>
              <ChevronRight className="w-3 h-3 text-slate-400" />
              <button
                onClick={() => setCurrentTab('part1')}
                className={`hover:text-slate-900 ${currentTab === 'part1' ? 'text-amber-600 font-bold' : ''}`}
              >
                Part 1: Sentiments
              </button>
              <ChevronRight className="w-3 h-3 text-slate-400" />
              <button
                onClick={() => setCurrentTab('part2')}
                className={`hover:text-slate-900 ${currentTab === 'part2' ? 'text-amber-600 font-bold' : ''}`}
              >
                Part 2: B.A.S.I.C. Ph
              </button>
              <ChevronRight className="w-3 h-3 text-slate-400" />
              <button
                onClick={() => setCurrentTab('part3')}
                className={`hover:text-slate-900 ${currentTab === 'part3' ? 'text-amber-600 font-bold' : ''}`}
              >
                Part 3: Finish Well
              </button>
              {!isStudentMode && (
                <>
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                  <button
                    onClick={() => setCurrentTab('teacher')}
                    className={`hover:text-slate-900 ${currentTab === 'teacher' ? 'text-indigo-600 font-bold' : ''}`}
                  >
                    Host Mode
                  </button>
                </>
              )}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-[11px] text-slate-400">
              Compatible with Singapore MOE SSOE Managed Browsers & iPads
            </span>
          </div>
        </div>
      </div>

      {/* Application Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 print:hidden border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <S17Logo size={42} showSubtitle={false} />
            <div>
              <p className="text-white font-bold text-sm">
                Secondary 1-7 • Learning to Learn and Grow Together
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Character and Citizenship Education (CCE) Wellbeing & Resilience Framework
              </p>
            </div>
          </div>

          <div className="text-center sm:text-right text-xs space-y-1">
            <p className="text-slate-300 font-medium">
              "Finishing well means having strengths to draw on and a class that stands with you."
            </p>
            <p className="text-slate-500">
              Offline-ready • Self-contained assets • High-res PNG digital cards
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

