import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  QrCode, 
  Users, 
  Trash2, 
  RotateCcw, 
  Download, 
  Upload, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Share2, 
  Copy, 
  Check, 
  MessageSquare, 
  Heart, 
  Sparkles, 
  ShieldCheck, 
  Filter, 
  FileSpreadsheet, 
  FileText,
  Search,
  ExternalLink,
  ChevronRight,
  Activity,
  Shuffle,
  ArrowUpDown,
  Clipboard
} from 'lucide-react';
import QRCodeLib from 'qrcode';
import { 
  StudentRosterItem, 
  MemoryNote, 
  GroupStrategyEntry, 
  FinishWellCardData 
} from '../types';
import { 
  getStoredRoster, 
  saveRoster, 
  getSentimentTally, 
  resetSentimentPoll, 
  deleteMemoryNote, 
  deleteGroupEntry, 
  deleteFinishWellCard, 
  exportParticipationCSV, 
  getStoredCards,
  subscribeToSync,
  INITIAL_S17_ROSTER,
  setRosterFromNamesText,
  buildStudentJoinUrl
} from '../utils/sessionStore';
import { playTapSound, playResetSound } from '../utils/sound';

interface TeacherDashboardProps {
  onClose?: () => void;
  onSwitchToStudent?: () => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ onClose, onSwitchToStudent }) => {
  const [activeTab, setActiveTab] = useState<'host' | 'roster' | 'participation' | 'moderation'>('host');
  const [roster, setRoster] = useState<StudentRosterItem[]>(getStoredRoster);
  const [tally, setTally] = useState(getSentimentTally);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'joined' | 'pending' | 'completed'>('all');

  // Confirmation dialogs
  const [showResetPollConfirm, setShowResetPollConfirm] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Content moderation lists - start clean, no fake starter memories
  const [memories, setMemories] = useState<MemoryNote[]>(() => {
    const saved = localStorage.getItem('s17_memories');
    if (saved) {
      try { 
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((m: any) => !['mem-1', 'mem-2', 'mem-3', 'mem-4', 'mem-5'].includes(m.id));
        }
      } catch {}
    }
    return [];
  });

  const [groupEntries, setGroupEntries] = useState<GroupStrategyEntry[]>(() => {
    const saved = localStorage.getItem('s17_group_strategies');
    if (saved) {
      try { 
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((g: any) => g.id !== 'grp-1');
        }
      } catch {}
    }
    return [];
  });

  const [finishWellCards, setFinishWellCards] = useState<FinishWellCardData[]>(getStoredCards);

  // Class list management state - Wheel of Names style blank text box
  const [namelistBoxText, setNamelistBoxText] = useState<string>(() => {
    const current = getStoredRoster();
    return current.map((s) => s.name).join('\n');
  });
  const [newStudentName, setNewStudentName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Dynamic student join URL embedding the class roster for static hosting (GitHub Pages)
  const studentJoinUrl = useMemo(() => {
    return buildStudentJoinUrl(roster);
  }, [roster]);

  // Generate QR code whenever the student join URL / roster updates
  useEffect(() => {
    if (!studentJoinUrl) return;

    QRCodeLib.toDataURL(studentJoinUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#0F172A',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    })
      .then((url) => setQrCodeDataUrl(url))
      .catch((err) => {
        console.warn('QR code fallback to base URL', err);
        const fallbackUrl = typeof window !== 'undefined'
          ? `${window.location.origin}${window.location.pathname}?mode=student&session=s17`
          : '';
        QRCodeLib.toDataURL(fallbackUrl, { width: 400, margin: 2 }).then(setQrCodeDataUrl);
      });
  }, [studentJoinUrl]);

  // Subscribe to real-time session sync events across tabs
  useEffect(() => {
    const unsubscribe = subscribeToSync((action) => {
      if (action === 'ROSTER_UPDATED' || action === 'STUDENT_CHANGED' || action === 'STUDENT_LOGOUT') {
        setRoster(getStoredRoster());
      }
      if (action === 'TALLY_UPDATED' || action === 'POLL_RESET') {
        setTally(getSentimentTally());
      }
      if (action === 'MEMORY_DELETED' || action === 'STORE_UPDATE') {
        const saved = localStorage.getItem('s17_memories');
        if (saved) {
          try { setMemories(JSON.parse(saved)); } catch {}
        }
      }
      if (action === 'GROUP_ENTRY_DELETED') {
        const saved = localStorage.getItem('s17_group_strategies');
        if (saved) {
          try { setGroupEntries(JSON.parse(saved)); } catch {}
        }
      }
      if (action === 'CARD_ADDED' || action === 'CARD_DELETED') {
        setFinishWellCards(getStoredCards());
      }
    });

    return () => unsubscribe();
  }, []);

  const handleCopyLink = () => {
    playTapSound();
    if (navigator.clipboard && studentJoinUrl) {
      navigator.clipboard.writeText(studentJoinUrl);
      setCopiedLink(true);
      showToast('📋 Student Join link copied (includes class list for dropdowns)!');
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // Administrative Control: Reset Poll Count
  const handleResetPollConfirm = () => {
    playResetSound();
    resetSentimentPoll();
    setTally({ manageable: 0, mixed: 0, heavy: 0 });
    setRoster(getStoredRoster());
    setShowResetPollConfirm(false);
    showToast('🔄 Activity 1 poll tally reset back to 0 successfully!');
  };

  // Administrative Control: Delete individual memory note
  const handleDeleteMemory = (id: string, author: string) => {
    playTapSound();
    const updated = deleteMemoryNote(id);
    setMemories(updated);
    showToast(`🗑️ Deleted reflection note by "${author}"`);
  };

  // Administrative Control: Delete group strategy entry
  const handleDeleteGroup = (id: string, groupName: string) => {
    playTapSound();
    const updated = deleteGroupEntry(id);
    setGroupEntries(updated);
    showToast(`🗑️ Deleted group strategy from "${groupName}"`);
  };

  // Administrative Control: Delete Finish Well Card
  const handleDeleteCard = (id: string, recipient: string) => {
    playTapSound();
    const updated = deleteFinishWellCard(id);
    setFinishWellCards(updated);
    showToast(`🗑️ Deleted Finish Well Card for "${recipient}"`);
  };

  // Class list management: Add single student
  const handleAddSingleStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;
    playTapSound();

    const newStudent: StudentRosterItem = {
      id: `s-${Date.now()}`,
      name: newStudentName.trim(),
      hasJoined: false,
      memoryNoteCount: 0,
      groupContributionsCount: 0,
      cardsSentCount: 0,
      reflectionCompleted: false,
      completionScore: 0,
    };

    const updated = [...roster, newStudent];
    setRoster(updated);
    saveRoster(updated);
    setNewStudentName('');
    showToast(`✅ Added "${newStudent.name}" to class roster.`);
  };

  // Class list management: File upload (.csv, .tsv, or .txt)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split(/[\r\n]+/);
      const parsedNames: string[] = [];

      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line) continue;

        // Skip standard header rows
        const lower = line.toLowerCase();
        if (
          lower === 'student name' ||
          lower === 'name' ||
          lower.startsWith('index,') ||
          lower.startsWith('no,') ||
          lower.startsWith('no.,') ||
          lower.startsWith('register number') ||
          lower.startsWith('s/n')
        ) {
          continue;
        }

        // Split CSV, TSV, or semicolon
        let tokens: string[] = [];
        if (line.includes('\t')) {
          tokens = line.split('\t');
        } else if (line.includes(';')) {
          tokens = line.split(';');
        } else if (line.includes(',')) {
          tokens = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        } else {
          tokens = [line];
        }

        tokens = tokens.map((t) => t.replace(/^["'\s]+|["'\s]+$/g, '').trim()).filter(Boolean);

        let candidate = '';
        if (tokens.length === 1) {
          candidate = tokens[0].replace(/^[0-9]+[.)\s-]+/, '').trim();
        } else if (tokens.length >= 2) {
          // If first token is a register number (e.g. "1", "01"), second column is usually the student name!
          if (/^[0-9]+$/.test(tokens[0]) && tokens[1]) {
            candidate = tokens[1].replace(/^[0-9]+[.)\s-]+/, '').trim();
          } else {
            // Pick the first non-numeric token that isn't a class label
            const nonNumeric = tokens.find((t) => !/^[0-9]+$/.test(t) && t.toLowerCase() !== 's1-7' && t.length > 2);
            candidate = nonNumeric || tokens[0];
          }
        }

        if (candidate && candidate.length > 1 && !/^[0-9]+$/.test(candidate)) {
          parsedNames.push(candidate);
        }
      }

      if (parsedNames.length > 0) {
        const updated = setRosterFromNamesText(parsedNames.join('\n'));
        setRoster(updated);
        setNamelistBoxText(updated.map((s) => s.name).join('\n'));
        showToast(`📁 Successfully loaded ${updated.length} student names from "${file.name}"!`);
      } else {
        showToast('⚠️ No valid student names found in uploaded file.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Export static class-list.csv for GitHub Pages repository
  const handleExportClassListForGitHub = () => {
    playTapSound();
    const csvContent = ['Index,Student Name,Class', ...roster.map((s, idx) => `${idx + 1},"${s.name}",S1-7`)].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'class-list.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('💾 Downloaded class-list.csv for GitHub Pages public folder!');
  };

  // Wheel of Names style namelist handlers
  const handleApplyNamelistBox = () => {
    playTapSound();
    const updated = setRosterFromNamesText(namelistBoxText);
    setRoster(updated);
    showToast(`✅ Updated class roster: ${updated.length} students enrolled.`);
  };

  const handleShuffleNamelist = () => {
    playTapSound();
    const lines = namelistBoxText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    for (let i = lines.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [lines[i], lines[j]] = [lines[j], lines[i]];
    }
    const shuffled = lines.join('\n');
    setNamelistBoxText(shuffled);
    showToast('🔀 Shuffled names in the box.');
  };

  const handleSortNamelist = () => {
    playTapSound();
    const lines = namelistBoxText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    lines.sort((a, b) => a.localeCompare(b));
    const sorted = lines.join('\n');
    setNamelistBoxText(sorted);
    showToast('🔤 Sorted names A to Z.');
  };

  const handleClearNamelistBox = () => {
    playTapSound();
    setNamelistBoxText('');
    setRoster([]);
    saveRoster([]);
    showToast('🗑️ Cleared class namelist.');
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        playTapSound();
        const combined = namelistBoxText.trim() ? `${namelistBoxText.trim()}\n${text}` : text;
        setNamelistBoxText(combined);
        const updated = setRosterFromNamesText(combined);
        setRoster(updated);
        showToast(`📋 Pasted & synced ${updated.length} names from clipboard.`);
      }
    } catch {
      showToast('ℹ️ Please click into the blank box and press Ctrl+V / Cmd+V to paste.');
    }
  };

  // Class list management: Remove student from roster
  const handleRemoveStudent = (id: string, name: string) => {
    playTapSound();
    const updated = roster.filter((s) => s.id !== id);
    setRoster(updated);
    saveRoster(updated);
    setNamelistBoxText(updated.map((s) => s.name).join('\n'));
    showToast(`Removed "${name}" from class list.`);
  };

  // Reset to default S1-7 roster
  const handleResetToDefaultRoster = () => {
    playResetSound();
    const defaultRoster: StudentRosterItem[] = INITIAL_S17_ROSTER.map((s) => ({
      id: s.id,
      name: s.name,
      hasJoined: false,
      memoryNoteCount: 0,
      groupContributionsCount: 0,
      cardsSentCount: 0,
      reflectionCompleted: false,
      completionScore: 0,
    }));
    setRoster(defaultRoster);
    saveRoster(defaultRoster);
    setNamelistBoxText(defaultRoster.map((s) => s.name).join('\n'));
    showToast('🔄 Loaded default 28 S1-7 student names.');
  };

  // Export CSV Participation Record
  const handleExportCSV = () => {
    playTapSound();
    const csvContent = exportParticipationCSV(roster);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `S1-7_CCE_Term4_Participation_Record_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('📊 Exported S1-7 Full Participation Record (.CSV)');
  };

  // Export JSON Report
  const handleExportJSON = () => {
    playTapSound();
    const exportData = {
      session: 'S1-7 CCE Term 4 Finish Well',
      date: new Date().toISOString(),
      classStats: {
        totalEnrolled: roster.length,
        totalJoined: roster.filter((s) => s.hasJoined).length,
        sentimentTally: tally,
        totalMemoryNotes: memories.length,
        totalGroupStrategies: groupEntries.length,
        totalCardsSent: finishWellCards.length,
      },
      students: roster,
      memories,
      groupEntries,
      finishWellCards,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `S1-7_CCE_Session_Archive_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('💾 Exported complete session archive (.JSON)');
  };

  // Computed metrics
  const totalEnrolled = roster.length;
  const joinedCount = roster.filter((s) => s.hasJoined).length;
  const joinedPct = totalEnrolled > 0 ? Math.round((joinedCount / totalEnrolled) * 100) : 0;
  const totalVotes = tally.manageable + tally.mixed + tally.heavy;
  const cardsCount = roster.filter((s) => s.cardsSentCount > 0).length;
  const reflectionCount = roster.filter((s) => s.reflectionCompleted).length;

  // Filtered roster for table
  const filteredRoster = roster.filter((student) => {
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (statusFilter === 'joined') return student.hasJoined;
    if (statusFilter === 'pending') return !student.hasJoined;
    if (statusFilter === 'completed') return student.completionScore >= 75;
    return true;
  });

  return (
    <div className="bg-slate-900 text-slate-100 rounded-3xl p-6 sm:p-8 border-4 border-slate-950 shadow-2xl space-y-8 animate-fadeIn">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-amber-400 text-slate-950 font-black px-5 py-3.5 rounded-2xl shadow-xl border-2 border-slate-950 flex items-center gap-3 animate-bounce">
          <Sparkles className="w-5 h-5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Mode Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-400 text-slate-950 mb-3 shadow-xs">
            <ShieldCheck className="w-4 h-4" />
            <span>Teacher Facilitator Host Console</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-3">
            Class S1-7 Session Host
          </h2>
          <p className="text-slate-400 text-sm mt-1 max-w-2xl leading-relaxed">
            Project this screen on the classroom whiteboard for students to scan and join. Monitor real-time participation, moderate student submissions, and export final records.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {onSwitchToStudent && (
            <button
              onClick={() => {
                playTapSound();
                onSwitchToStudent();
              }}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm flex items-center gap-2 border border-slate-700 transition active:scale-95"
            >
              <ExternalLink className="w-4 h-4 text-amber-400" />
              <span>Preview Student View</span>
            </button>
          )}

          <button
            onClick={handleExportCSV}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm flex items-center gap-2 shadow-md transition active:scale-95"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Participation CSV</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-950 rounded-2xl border border-slate-800">
        <button
          onClick={() => { playTapSound(); setActiveTab('host'); }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm transition-all ${
            activeTab === 'host'
              ? 'bg-amber-400 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>Whiteboard QR Host</span>
        </button>

        <button
          onClick={() => { playTapSound(); setActiveTab('participation'); }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm transition-all ${
            activeTab === 'participation'
              ? 'bg-amber-400 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Real-Time Participation ({joinedCount}/{totalEnrolled})</span>
        </button>

        <button
          onClick={() => { playTapSound(); setActiveTab('roster'); }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm transition-all ${
            activeTab === 'roster'
              ? 'bg-amber-400 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Class Roster ({totalEnrolled})</span>
        </button>

        <button
          onClick={() => { playTapSound(); setActiveTab('moderation'); }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm transition-all ${
            activeTab === 'moderation'
              ? 'bg-amber-400 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Moderation & Admin Controls</span>
        </button>
      </div>

      {/* TAB 1: WHITEBOARD QR HOST */}
      {activeTab === 'host' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Large QR Display Card for Projector */}
          <div className="lg:col-span-6 bg-slate-950 p-8 rounded-3xl border-2 border-slate-800 flex flex-col items-center text-center shadow-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30 mb-4">
              <span>Classroom Projector View</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-white">
              Scan with iPad or Phone Camera
            </h3>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-sm mb-6">
              Secondary 1-7 • Term 4 CCE Lesson • "Finishing Well Together"
            </p>

            {/* QR Code Graphic */}
            <div className="p-4 bg-white rounded-3xl shadow-2xl border-4 border-amber-400 inline-block">
              {qrCodeDataUrl ? (
                <img
                  src={qrCodeDataUrl}
                  alt="Student Session QR Code"
                  className="w-64 h-64 sm:w-72 sm:h-72 object-contain rounded-xl"
                />
              ) : (
                <div className="w-64 h-64 flex items-center justify-center text-slate-400">
                  Generating QR Code...
                </div>
              )}
            </div>

            {/* Join URL & Code */}
            <div className="mt-6 w-full max-w-md bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                <span>Session Link:</span>
                <span className="text-amber-400 font-mono">CODE: S1-7-T4</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={studentJoinUrl}
                  className="w-full bg-slate-950 border border-slate-700 px-3 py-2 rounded-xl text-xs font-mono text-slate-300 truncate focus:outline-hidden"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shrink-0 flex items-center gap-1.5 transition active:scale-95"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px]">
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{roster.length} students embedded for dropdown selection</span>
                </span>
                <a
                  href={studentJoinUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-amber-300 hover:text-amber-200 font-bold underline"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Test Student View</span>
                </a>
              </div>
            </div>
          </div>

          {/* Live Session Counter & Student Instructions */}
          <div className="lg:col-span-6 space-y-6">
            {/* Live Counter Card */}
            <div className="bg-slate-950 p-6 sm:p-8 rounded-3xl border-2 border-slate-800 space-y-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xl font-bold text-white">Live Student Check-In</h4>
                  <p className="text-xs text-slate-400">Real-time attendance in S1-7</p>
                </div>
                <div className="text-right">
                  <span className="text-4xl font-black text-amber-400">{joinedCount}</span>
                  <span className="text-slate-500 text-xl font-bold"> / {totalEnrolled}</span>
                  <div className="text-xs font-semibold text-emerald-400">{joinedPct}% Present</div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-500 rounded-full"
                  style={{ width: `${joinedPct}%` }}
                />
              </div>

              {/* Instructions for Students */}
              <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 space-y-3">
                <h5 className="text-xs font-black uppercase tracking-wider text-amber-400">
                  3-Step Student Join Instructions:
                </h5>
                <ol className="text-xs text-slate-300 space-y-2 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-black flex items-center justify-center text-[10px] shrink-0 mt-0.5">1</span>
                    <span>Scan the QR code on the screen using your iPad camera or enter the join link.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-black flex items-center justify-center text-[10px] shrink-0 mt-0.5">2</span>
                    <span>Select your name from the S1-7 roster drop-down to log your attendance.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-black flex items-center justify-center text-[10px] shrink-0 mt-0.5">3</span>
                    <span>Vote in Activity 1, post memories, test coping channels, and exchange Finish Well cards!</span>
                  </li>
                </ol>
              </div>

              {/* Quick Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-2">
                {totalEnrolled === 0 && (
                  <button
                    onClick={() => setActiveTab('roster')}
                    className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-md transition active:scale-95"
                  >
                    <Users className="w-4 h-4" />
                    <span>Paste Class Namelist (Currently Blank)</span>
                  </button>
                )}
                <button
                  onClick={() => setActiveTab('participation')}
                  className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition active:scale-95"
                >
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>View Participation Matrix</span>
                </button>
                <button
                  onClick={() => setShowResetPollConfirm(true)}
                  className="px-4 py-2.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 font-bold text-xs flex items-center gap-2 border border-rose-800 transition active:scale-95"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset Poll ({totalVotes})</span>
                </button>
              </div>
            </div>

            {/* Quick Sentiment Status Summary */}
            <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-4">
              <h4 className="text-sm font-black uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Activity 1 Live Sentiment Snapshot</span>
                <span className="text-xs font-mono text-amber-400">{totalVotes} votes</span>
              </h4>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-emerald-950/40 p-3 rounded-2xl border border-emerald-800/50">
                  <div className="text-xl font-black text-emerald-400">{tally.manageable}</div>
                  <div className="text-[11px] text-emerald-300 font-semibold mt-0.5">Manageable</div>
                </div>
                <div className="bg-amber-950/40 p-3 rounded-2xl border border-amber-800/50">
                  <div className="text-xl font-black text-amber-400">{tally.mixed}</div>
                  <div className="text-[11px] text-amber-300 font-semibold mt-0.5">Mixed</div>
                </div>
                <div className="bg-rose-950/40 p-3 rounded-2xl border border-rose-800/50">
                  <div className="text-xl font-black text-rose-400">{tally.heavy}</div>
                  <div className="text-[11px] text-rose-300 font-semibold mt-0.5">Heavy</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: REAL-TIME PARTICIPATION TRACKER */}
      {activeTab === 'participation' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-950 p-5 rounded-2xl border border-slate-800">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search student name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-xs rounded-xl pl-9 pr-4 py-2 text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400 w-48 sm:w-64"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-slate-900 border border-slate-700 text-xs rounded-xl px-3 py-2 text-slate-300 focus:outline-hidden"
              >
                <option value="all">All Students ({roster.length})</option>
                <option value="joined">Joined Only ({joinedCount})</option>
                <option value="pending">Pending Join ({totalEnrolled - joinedCount})</option>
                <option value="completed">High Progress ≥75%</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCSV}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-sm transition active:scale-95"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Download CSV Record</span>
              </button>
              <button
                onClick={handleExportJSON}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-2 border border-slate-700 transition active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span>JSON</span>
              </button>
            </div>
          </div>

          {/* Participation Table */}
          <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider font-bold border-b border-slate-800">
                  <tr>
                    <th className="p-4">#</th>
                    <th className="p-4">Student Name</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Act 1: Sentiment</th>
                    <th className="p-4">Act 1: Notes</th>
                    <th className="p-4">Act 3: Groups</th>
                    <th className="p-4">Act 4: Card Sent</th>
                    <th className="p-4">Act 4: Reflection</th>
                    <th className="p-4 text-right">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {filteredRoster.map((student, idx) => {
                    const sentimentColors: Record<string, string> = {
                      manageable: 'text-emerald-400 bg-emerald-950/60 border-emerald-800',
                      mixed: 'text-amber-400 bg-amber-950/60 border-amber-800',
                      heavy: 'text-rose-400 bg-rose-950/60 border-rose-800',
                    };

                    return (
                      <tr key={student.id} className="hover:bg-slate-900/40 transition">
                        <td className="p-4 text-slate-500">{idx + 1}</td>
                        <td className="p-4 font-bold text-white">
                          {student.name}
                        </td>
                        <td className="p-4">
                          {student.hasJoined ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-700">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Joined
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-800/80 text-slate-400 border border-slate-700">
                              <Clock className="w-3 h-3" /> Waiting
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          {student.sentimentVote ? (
                            <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase ${sentimentColors[student.sentimentVote]}`}>
                              {student.sentimentVote}
                            </span>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>
                        <td className="p-4">
                          {student.memoryNoteCount > 0 ? (
                            <span className="text-amber-300 font-bold">
                              {student.memoryNoteCount} note{student.memoryNoteCount > 1 ? 's' : ''}
                            </span>
                          ) : (
                            <span className="text-slate-600">0</span>
                          )}
                        </td>
                        <td className="p-4">
                          {student.groupContributionsCount > 0 ? (
                            <span className="text-sky-300 font-bold">
                              {student.groupContributionsCount} entry
                            </span>
                          ) : (
                            <span className="text-slate-600">0</span>
                          )}
                        </td>
                        <td className="p-4">
                          {student.cardsSentCount > 0 ? (
                            <span className="text-rose-300 font-bold truncate max-w-[120px] block" title={`To: ${student.cardRecipientName || 'Classmate'}`}>
                              To: {student.cardRecipientName || 'Done'}
                            </span>
                          ) : (
                            <span className="text-slate-600">0</span>
                          )}
                        </td>
                        <td className="p-4">
                          {student.reflectionCompleted ? (
                            <span className="inline-flex items-center gap-1 text-emerald-400 font-bold text-[11px]">
                              <Check className="w-3.5 h-3.5" /> Done
                            </span>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <span className={`px-2 py-1 rounded-lg font-black text-xs ${
                            student.completionScore >= 75
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : student.completionScore >= 35
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-slate-900 text-slate-500 border border-slate-800'
                          }`}>
                            {student.completionScore}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CLASS ROSTER MANAGEMENT - Wheel of Names style blank namelist box */}
      {activeTab === 'roster' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950 p-6 rounded-3xl border border-slate-800">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30 mb-2">
                <span>Wheel of Names Style Namelist</span>
              </div>
              <h3 className="text-2xl font-black text-white">Class List Management</h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
                Simply paste your student names into the blank box below (one student per line), exactly like Wheel of Names. Names are instantly saved and synchronized to the student join screen.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
              <input
                type="file"
                ref={fileInputRef}
                accept=".txt,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold text-xs flex items-center gap-2 border border-slate-700 transition active:scale-95"
              >
                <Upload className="w-3.5 h-3.5 text-amber-400" />
                <span>Upload .csv / .txt</span>
              </button>
              <button
                onClick={handleExportClassListForGitHub}
                className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-300 font-bold text-xs flex items-center gap-1.5 border border-emerald-800/60 transition active:scale-95"
                title="Download class-list.csv for GitHub Pages public folder"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Save class-list.csv</span>
              </button>
              <button
                onClick={handleResetToDefaultRoster}
                className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white font-bold text-xs flex items-center gap-1.5 border border-slate-800 transition active:scale-95"
                title="Restore default S1-7 sample names"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Load S1-7 (28)</span>
              </button>
            </div>
          </div>

          {/* 2-Column Responsive Workspace: Blank Box on Left, Live Roster on Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN: THE BLANK NAMELIST BOX */}
            <div className="lg:col-span-5 bg-slate-950 p-6 rounded-3xl border-2 border-slate-800 flex flex-col justify-between space-y-4 shadow-xl">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-white text-base">Namelist Box</h4>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400 text-slate-950">
                      {namelistBoxText.split(/\r?\n/).map(l => l.replace(/^[0-9]+[.)\s-]+/, '').trim()).filter(l => l.length > 0).length} names
                    </span>
                  </div>
                  
                  {/* Wheel of Names Actions toolbar */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleSortNamelist}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-[11px] font-bold flex items-center gap-1 transition"
                      title="Sort A to Z"
                    >
                      <ArrowUpDown className="w-3 h-3 text-amber-400" />
                      <span className="hidden sm:inline">Sort</span>
                    </button>
                    <button
                      onClick={handleShuffleNamelist}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-[11px] font-bold flex items-center gap-1 transition"
                      title="Shuffle names randomly"
                    >
                      <Shuffle className="w-3 h-3 text-amber-400" />
                      <span className="hidden sm:inline">Shuffle</span>
                    </button>
                    <button
                      onClick={handlePasteClipboard}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-[11px] font-bold flex items-center gap-1 transition"
                      title="Paste from clipboard"
                    >
                      <Clipboard className="w-3 h-3 text-amber-400" />
                      <span className="hidden sm:inline">Paste</span>
                    </button>
                    <button
                      onClick={handleClearNamelistBox}
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-300 transition"
                      title="Clear box"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-400 mt-2 mb-3">
                  Click below and paste your class namelist (one student per line):
                </p>

                {/* The Blank Textarea */}
                <div className="relative">
                  <textarea
                    rows={14}
                    value={namelistBoxText}
                    onChange={(e) => setNamelistBoxText(e.target.value)}
                    placeholder={`Paste student names here, one per line...&#10;&#10;e.g.&#10;Ahmad Bin Danial&#10;Chloe Teo Yu Ting&#10;Daniel Tan Jia Le&#10;Faith Neo&#10;George Lim`}
                    className="w-full bg-slate-900 border-2 border-slate-800 hover:border-slate-700 focus:border-amber-400 text-white rounded-2xl p-4 text-xs sm:text-sm font-mono leading-relaxed placeholder-slate-600 focus:outline-hidden transition resize-y min-h-[280px]"
                  />
                </div>
              </div>

              {/* Bottom Apply Button */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <button
                  onClick={handleApplyNamelistBox}
                  className="w-full py-3.5 px-4 rounded-2xl bg-amber-400 hover:bg-amber-300 active:scale-[0.98] text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg transition"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Update Class Roster ({namelistBoxText.split(/\r?\n/).map(l => l.replace(/^[0-9]+[.)\s-]+/, '').trim()).filter(l => l.length > 0).length} Students)</span>
                </button>
                <p className="text-[11px] text-slate-400 text-center font-medium">
                  ⚡ Updates instantly for student iPad check-in & participation logs
                </p>
              </div>
            </div>

            {/* RIGHT COLUMN: ACTIVE ROSTER & LIVE ATTENDANCE */}
            <div className="lg:col-span-7 bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-5 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div>
                  <h4 className="text-lg font-black text-white">Active Session Roster</h4>
                  <div className="flex items-center gap-3 mt-1 text-xs">
                    <span className="text-slate-400 font-medium">Enrolled: <strong className="text-white">{roster.length}</strong></span>
                    <span className="text-emerald-400 font-medium">Present: <strong>{roster.filter(s => s.hasJoined).length}</strong></span>
                    <span className="text-slate-500 font-medium">Waiting: <strong>{roster.filter(s => !s.hasJoined).length}</strong></span>
                  </div>
                </div>

                {/* Quick search */}
                <div className="relative min-w-[200px]">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search student..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Add Single Student Quick Input */}
              <form onSubmit={handleAddSingleStudent} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Quick add single student name..."
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-800 text-xs rounded-xl px-4 py-2 text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 transition active:scale-95 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </form>

              {/* Roster Cards List / Empty State */}
              {roster.length === 0 ? (
                <div className="py-12 px-6 rounded-2xl border-2 border-dashed border-slate-800 text-center bg-slate-900/40">
                  <div className="w-12 h-12 rounded-2xl bg-amber-400/20 text-amber-300 flex items-center justify-center mx-auto mb-3">
                    <Users className="w-6 h-6" />
                  </div>
                  <h5 className="text-base font-bold text-white">Class List is Empty</h5>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
                    Paste your class namelist into the blank box on the left, then click <strong>Update Class Roster</strong>.
                  </p>
                  <button
                    onClick={handleResetToDefaultRoster}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Load S1-7 Sample (28 Names)
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[440px] overflow-y-auto pr-1">
                  {roster
                    .filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase().trim()))
                    .map((student, idx) => (
                      <div
                        key={student.id}
                        className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 flex items-center justify-between group hover:border-slate-700 transition"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-6 h-6 rounded-lg bg-slate-950 text-slate-400 font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <div className="truncate">
                            <p className="text-xs font-bold text-white truncate">{student.name}</p>
                            <span className={`text-[10px] font-semibold ${student.hasJoined ? 'text-emerald-400' : 'text-slate-500'}`}>
                              {student.hasJoined ? '🟢 Checked In' : '⚪ Waiting'}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveStudent(student.id, student.name)}
                          className="w-7 h-7 rounded-lg bg-slate-950 hover:bg-rose-900/60 text-slate-500 hover:text-rose-300 flex items-center justify-center transition shrink-0 opacity-0 group-hover:opacity-100"
                          title="Remove from roster"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: MODERATION & ADMINISTRATIVE CONTROLS */}
      {activeTab === 'moderation' && (
        <div className="space-y-8">
          {/* Admin Control: Reset Poll Count Section */}
          <div className="bg-slate-950 p-6 rounded-2xl border-2 border-rose-900/40 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-lg font-black text-rose-300 flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-rose-400" />
                  Reset Activity 1 Sentiment Poll Count
                </h4>
                <p className="text-xs text-slate-400 mt-1 max-w-xl">
                  Clears all current student votes (Manageable: {tally.manageable}, Mixed: {tally.mixed}, Heavy: {tally.heavy}) back to 0. Use this if testing before the actual class session starts.
                </p>
              </div>
              <button
                onClick={() => setShowResetPollConfirm(true)}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs flex items-center gap-2 shadow-md transition active:scale-95 self-start sm:self-auto shrink-0"
              >
                <Trash2 className="w-4 h-4" />
                <span>Reset Poll to 0</span>
              </button>
            </div>
          </div>

          {/* Delete Individual Student Posts: Activity 1 Post-It Notes */}
          <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-black text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-amber-400" />
                  Activity 1: Student Growth Reflection Notes ({memories.length})
                </h4>
                <p className="text-xs text-slate-400">
                  Delete inappropriate, duplicate, or test notes submitted by students.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
              {memories.map((note) => (
                <div
                  key={note.id}
                  className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                      <span>{note.category}</span>
                      <span className="text-slate-400 truncate max-w-[120px]">{note.author}</span>
                    </div>
                    <p className="text-xs text-slate-200 mt-2 font-medium line-clamp-3">
                      "{note.text}"
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                    <span className="text-slate-500 text-[11px]">❤️ {note.likes}</span>
                    <button
                      onClick={() => handleDeleteMemory(note.id, note.author)}
                      className="px-2.5 py-1 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 font-bold text-[11px] flex items-center gap-1 transition active:scale-95"
                    >
                      <Trash2 className="w-3 h-3" /> Delete Post
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delete Individual Student Posts: Finish Well Cards */}
          <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
            <div>
              <h4 className="text-lg font-black text-white flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-400" />
                Activity 4: Completed Finish Well Cards ({finishWellCards.length})
              </h4>
              <p className="text-xs text-slate-400">
                Inspect and moderate affirmation cards created by student pairs.
              </p>
            </div>

            {finishWellCards.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4">No finish well cards submitted yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                {finishWellCards.map((card) => (
                  <div
                    key={card.id}
                    className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-amber-400">To: {card.recipientName}</span>
                        <span className="text-slate-400">By: {card.partnerName}</span>
                      </div>
                      <p className="text-xs text-slate-300 mt-2 font-medium line-clamp-3">
                        "You can get through Term 4 when you {card.getThroughWhen || card.youAre}"
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                      <span className="text-slate-500 text-[10px]">{new Date(card.createdAt).toLocaleTimeString()}</span>
                      <button
                        onClick={() => handleDeleteCard(card.id, card.recipientName)}
                        className="px-2.5 py-1 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 font-bold text-[11px] flex items-center gap-1 transition active:scale-95"
                      >
                        <Trash2 className="w-3 h-3" /> Delete Card
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: RESET POLL */}
      {showResetPollConfirm && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-rose-600 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-950 text-rose-400 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black text-white">Reset Sentiment Poll?</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              This will reset the collective Activity 1 poll tally back to 0 (Manageable: 0, Mixed: 0, Heavy: 0) and clear the individual sentiment votes across connected devices. This cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                onClick={() => setShowResetPollConfirm(false)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleResetPollConfirm}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-md transition"
              >
                Yes, Reset Poll
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
