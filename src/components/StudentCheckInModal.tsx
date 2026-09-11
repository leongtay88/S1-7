import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  CheckCircle2, 
  Sparkles, 
  X, 
  UserCheck, 
  ArrowRight,
  UserPlus,
  ChevronDown,
  RefreshCw
} from 'lucide-react';
import { S17Logo } from './S17Logo';
import { StudentRosterItem } from '../types';
import { getStoredRoster, setCurrentStudent, saveRoster, subscribeToSync } from '../utils/sessionStore';
import { playTapSound, playCelebrationFanfare } from '../utils/sound';

interface StudentCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStudent: StudentRosterItem | null;
  onStudentSelected?: (student: StudentRosterItem) => void;
}

export const StudentCheckInModal: React.FC<StudentCheckInModalProps> = ({
  isOpen,
  onClose,
  currentStudent,
  onStudentSelected,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roster, setRoster] = useState<StudentRosterItem[]>(getStoredRoster);
  const [customName, setCustomName] = useState('');
  const [showAddCustom, setShowAddCustom] = useState(false);

  // Sync roster whenever modal opens or cross-tab/sync event arrives
  useEffect(() => {
    if (isOpen) {
      setRoster(getStoredRoster());
    }
  }, [isOpen]);

  useEffect(() => {
    const unsubscribe = subscribeToSync((action) => {
      if (action === 'ROSTER_UPDATED') {
        setRoster(getStoredRoster());
      }
    });

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 's17_student_roster') {
        setRoster(getStoredRoster());
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  if (!isOpen) return null;

  const handleReloadRoster = () => {
    playTapSound();
    const updated = getStoredRoster();
    setRoster(updated);
  };

  const filteredRoster = roster.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const handleSelectStudent = (student: StudentRosterItem) => {
    playTapSound();
    setCurrentStudent(student.id);
    if (onStudentSelected) {
      onStudentSelected(student);
    }
    playCelebrationFanfare();
    onClose();
  };

  const handleAddCustomStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    playTapSound();
    const newId = `s-${Date.now()}`;
    const newItem: StudentRosterItem = {
      id: newId,
      name: customName.trim(),
      hasJoined: true,
      joinedAt: Date.now(),
      memoryNoteCount: 0,
      groupContributionsCount: 0,
      cardsSentCount: 0,
      reflectionCompleted: false,
      completionScore: 15,
    };

    const updated = [...roster, newItem];
    setRoster(updated);
    saveRoster(updated);
    setCurrentStudent(newId);

    if (onStudentSelected) {
      onStudentSelected(newItem);
    }
    playCelebrationFanfare();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border-3 border-slate-900 relative max-h-[90vh] flex flex-col">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-4 pb-4 border-b-2 border-slate-100 shrink-0">
          <div className="p-2 bg-amber-50 rounded-2xl border-2 border-slate-900 shadow-xs shrink-0">
            <S17Logo size={52} showSubtitle={false} />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-200 text-slate-950 mb-1">
              <Users className="w-3 h-3 text-slate-950" />
              <span>S1-7 Student Check-In</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
              Select Your Name
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              Join the lesson to record your Term 4 CCE participation
            </p>
          </div>
        </div>

        {/* Current Student status if already chosen */}
        {currentStudent && (
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <span className="text-[11px] font-bold text-emerald-900 block">Currently Checked In As:</span>
                <span className="text-sm font-black text-slate-950">{currentStudent.name}</span>
              </div>
            </div>
            <span className="text-xs font-black bg-emerald-200 text-emerald-950 px-2 py-1 rounded-lg">
              Active
            </span>
          </div>
        )}

        {/* Drop-down list selector - prominent primary selection */}
        {roster.length > 0 ? (
          <div className="mt-4 shrink-0">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5 flex items-center justify-between">
              <span>▼ Select Your Name (Drop-Down List):</span>
              <span className="text-[11px] font-bold text-amber-900 bg-amber-200 px-2 py-0.5 rounded-md">
                {roster.length} Students
              </span>
            </label>
            <div className="relative">
              <select
                id="student-modal-dropdown-select"
                value={currentStudent?.id || ''}
                onChange={(e) => {
                  const found = roster.find((s) => s.id === e.target.value);
                  if (found) {
                    handleSelectStudent(found);
                  }
                }}
                className="w-full py-3 pl-3.5 pr-10 rounded-2xl border-2 border-slate-900 text-sm font-black bg-amber-100 hover:bg-amber-200 text-slate-950 focus:ring-4 focus:ring-amber-400 focus:outline-hidden cursor-pointer transition appearance-none shadow-xs"
              >
                <option value="">▼ Click to choose your name ({roster.length} students)...</option>
                {roster.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.hasJoined ? '(Checked In ✓)' : ''}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-950">
                <ChevronDown className="w-5 h-5" />
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4 p-3 bg-amber-50 border-2 border-amber-300 rounded-2xl flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900">Class list not loaded yet</span>
            <button
              type="button"
              onClick={handleReloadRoster}
              className="px-3 py-1.5 bg-amber-400 hover:bg-amber-500 text-slate-950 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-2xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Load S1-7 List
            </button>
          </div>
        )}

        {/* Search input */}
        <div className="mt-3 relative shrink-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Or type your name to filter..."
            className="w-full pl-10 pr-4 py-2 rounded-2xl border-2 border-slate-900 text-xs sm:text-sm font-bold bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-400 focus:outline-hidden"
          />
        </div>

        {/* Student list */}
        <div className="mt-3 flex-1 overflow-y-auto space-y-1.5 pr-1 min-h-[220px]">
          {roster.length === 0 ? (
            <div className="text-center py-6 px-4 bg-amber-50/60 rounded-2xl border border-amber-200">
              <Sparkles className="w-8 h-8 text-amber-600 mx-auto mb-2" />
              <h4 className="text-sm font-black text-slate-900">
                Join Lesson
              </h4>
              <p className="text-xs text-slate-600 mt-1 mb-4 font-medium">
                Type your full name below to record your attendance and participate in today's S1-7 lesson!
              </p>
              <form onSubmit={handleAddCustomStudent} className="flex flex-col sm:flex-row gap-2 max-w-sm mx-auto">
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Enter your name (e.g. Rachel Koh)..."
                  className="flex-1 px-3.5 py-2.5 rounded-xl border-2 border-slate-900 text-xs font-bold bg-white focus:outline-hidden"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-slate-950 hover:bg-slate-800 text-amber-300 rounded-xl font-black text-xs shadow-xs"
                >
                  Join Class
                </button>
              </form>
            </div>
          ) : filteredRoster.length > 0 ? (
            filteredRoster.map((student) => {
              const isSelected = currentStudent?.id === student.id;
              return (
                <button
                  key={student.id}
                  onClick={() => handleSelectStudent(student)}
                  className={`w-full p-3 rounded-2xl border text-left transition flex items-center justify-between group ${
                    isSelected
                      ? 'bg-amber-100 border-slate-900 text-slate-950 font-black shadow-xs'
                      : 'bg-white hover:bg-amber-50/70 border-slate-200 text-slate-800 hover:border-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                      isSelected ? 'bg-slate-950 text-amber-300' : 'bg-slate-100 text-slate-700 group-hover:bg-amber-200'
                    }`}>
                      {student.name.charAt(0)}
                    </div>
                    <span className="text-sm font-bold">{student.name}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {student.hasJoined && !isSelected && (
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-semibold">
                        Joined
                      </span>
                    )}
                    {isSelected ? (
                      <span className="text-xs bg-slate-950 text-amber-300 font-black px-2.5 py-1 rounded-xl flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Selected
                      </span>
                    ) : (
                      <span className="text-xs font-black text-slate-900 group-hover:text-amber-700 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                        <span>Select</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-slate-500 font-medium">
                No matching student found for "{searchQuery}".
              </p>
              <button
                onClick={() => {
                  setCustomName(searchQuery);
                  setShowAddCustom(true);
                }}
                className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs border-2 border-slate-900 shadow-xs"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add "{searchQuery}" as New Student</span>
              </button>
            </div>
          )}
        </div>

        {/* Option to add custom student name */}
        <div className="mt-3 pt-3 border-t border-slate-200 shrink-0">
          {!showAddCustom ? (
            <button
              onClick={() => setShowAddCustom(true)}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 mx-auto"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Not on this list? Add your name</span>
            </button>
          ) : (
            <form onSubmit={handleAddCustomStudent} className="flex gap-2">
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Enter Full Name..."
                className="flex-1 px-3 py-2 rounded-xl border-2 border-slate-900 text-xs font-bold bg-white focus:ring-2 focus:ring-amber-300 focus:outline-hidden"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-amber-300 rounded-xl font-black text-xs whitespace-nowrap"
              >
                Add & Join
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
