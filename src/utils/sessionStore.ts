import { 
  SentimentType, 
  MemoryNote, 
  GroupStrategyEntry, 
  FinishWellCardData, 
  IndividualReflectionData, 
  StudentRosterItem, 
  SessionConfig 
} from '../types';
import { STARTER_MEMORIES } from '../data/cceData';
import { 
  publishLiveAction, 
  subscribeToRemoteActions, 
  startLiveSync, 
  getLiveSyncRoom, 
  pollRecentEvents 
} from './liveSync';

export { 
  startLiveSync, 
  stopLiveSync, 
  reconnectSync, 
  getLiveSyncRoom, 
  setLiveSyncRoom, 
  subscribeToLiveStatus, 
  pollRecentEvents 
} from './liveSync';

export const INITIAL_S17_ROSTER: { id: string; name: string }[] = [
  { id: 's-01', name: 'Sarah Lim Zhi Xuan' },
  { id: 's-02', name: 'Marcus Tan Jun Jie' },
  { id: 's-03', name: 'Muhammad Aqil Bin Roslan' },
  { id: 's-04', name: 'Priya d/o Senthil Kumar' },
  { id: 's-05', name: 'Chloe Teo Yu Ting' },
  { id: 's-06', name: 'Lucas Ng Kai En' },
  { id: 's-07', name: 'Ahmad Bin Danial' },
  { id: 's-08', name: 'Rachel Koh Pei Shan' },
  { id: 's-09', name: 'Ethan Low Wei Ming' },
  { id: 's-10', name: 'Nurul Ain Binte Ridzwan' },
  { id: 's-11', name: 'Daniel Tan Jia Le' },
  { id: 's-12', name: 'Cheryl Lim Hui Min' },
  { id: 's-13', name: 'Ryan Lee Ming Xuan' },
  { id: 's-14', name: 'Megan Foo Xin Yi' },
  { id: 's-15', name: 'Joshua Chen Jun Wei' },
  { id: 's-16', name: 'Siti Nurhaliza Binte Osman' },
  { id: 's-17', name: 'Kevin Seah Boon Kiat' },
  { id: 's-18', name: 'Denise Wong En Qi' },
  { id: 's-19', name: 'Samuel Neo Yu Ze' },
  { id: 's-20', name: 'Kavitha Rajendran' },
  { id: 's-21', name: 'Justin Teo Bing Heng' },
  { id: 's-22', name: 'Valerie Sim Jia Ying' },
  { id: 's-23', name: 'Zachary Tan Rui Jie' },
  { id: 's-24', name: 'Nicole Tay Si En' },
  { id: 's-25', name: 'Dominic Goh Kai Feng' },
  { id: 's-26', name: 'Janice Tan Shu Wen' },
  { id: 's-27', name: 'Keith Chong Wei Liang' },
  { id: 's-28', name: 'Ashraf Bin Zulkifli' },
];

const BROADCAST_CHANNEL_NAME = 's17_cce_sync_channel';

// Safe broadcast channel for multi-tab sync
let channel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
  } catch (e) {
    console.warn('BroadcastChannel not available', e);
  }
}

export const notifySync = (action: string, payload?: unknown, options?: { skipRemotePublish?: boolean }) => {
  if (channel) {
    try {
      channel.postMessage({ action, payload, timestamp: Date.now() });
    } catch {
      // ignore
    }
  }
  // Also dispatch a custom window event for same-tab reactivity
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('s17_store_update', { detail: { action, payload } }));
  }

  // Cross-device live sync over WebSocket / cloud pubsub
  if (!options?.skipRemotePublish) {
    publishLiveAction(action, payload).catch(() => {});
  }
};

export const subscribeToSync = (callback: (action: string, payload: unknown) => void) => {
  const handleMessage = (event: MessageEvent) => {
    if (event.data && event.data.action) {
      callback(event.data.action, event.data.payload);
    }
  };

  const handleCustomEvent = (event: Event) => {
    const custom = event as CustomEvent;
    if (custom.detail) {
      callback(custom.detail.action, custom.detail.payload);
    }
  };

  if (channel) {
    channel.addEventListener('message', handleMessage);
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('s17_store_update', handleCustomEvent);
  }

  return () => {
    if (channel) {
      channel.removeEventListener('message', handleMessage);
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('s17_store_update', handleCustomEvent);
    }
  };
};

/**
 * Applies incoming live action received from remote peer/student device
 */
export const applyIncomingRemoteAction = (action: string, payload: any) => {
  try {
    if (action === 'STUDENT_CHANGED' || action === 'STUDENT_CHECK_IN') {
      const studentData = payload as StudentRosterItem;
      if (studentData && (studentData.id || studentData.name)) {
        const roster = getStoredRoster();
        const existing = roster.find(
          (s) => s.id === studentData.id || s.name.trim().toLowerCase() === studentData.name?.trim().toLowerCase()
        );
        if (existing) {
          existing.hasJoined = true;
          if (!existing.joinedAt) existing.joinedAt = studentData.joinedAt || Date.now();
          calculateAndUpdateScores(roster);
          saveRoster(roster, { skipRemotePublish: true });
          notifySync('STUDENT_JOINED_REMOTE', existing, { skipRemotePublish: true });
        }
      }
    } else if (action === 'VOTE_SENTIMENT') {
      const { vote, prevVote, studentId, studentName } = payload || {};
      if (vote) {
        const tally = getSentimentTally();
        if (prevVote && (tally as any)[prevVote] !== undefined) {
          (tally as any)[prevVote] = Math.max(0, (tally as any)[prevVote] - 1);
        }
        if ((tally as any)[vote] !== undefined) {
          (tally as any)[vote] = ((tally as any)[vote] || 0) + 1;
        }
        saveSentimentTally(tally, { skipRemotePublish: true });

        const roster = getStoredRoster();
        const student = roster.find(
          (s) => (studentId && s.id === studentId) || (studentName && s.name.trim().toLowerCase() === studentName.trim().toLowerCase())
        );
        if (student) {
          student.hasJoined = true;
          if (!student.joinedAt) student.joinedAt = Date.now();
          student.sentimentVote = vote;
          student.sentimentTime = Date.now();
          calculateAndUpdateScores(roster);
          saveRoster(roster, { skipRemotePublish: true });
        }
        notifySync('TALLY_UPDATED', tally, { skipRemotePublish: true });
        notifySync('ROSTER_UPDATED', roster, { skipRemotePublish: true });
      }
    } else if (action === 'TALLY_UPDATED') {
      if (payload && typeof payload === 'object') {
        saveSentimentTally(payload as any, { skipRemotePublish: true });
      }
    } else if (action === 'MEMORY_NOTE_ADDED' || action === 'MEMORY_ADDED') {
      const note = payload as MemoryNote;
      if (note && note.id && note.text) {
        const saved = localStorage.getItem('s17_memories');
        let memories: MemoryNote[] = [];
        if (saved) {
          try { memories = JSON.parse(saved); } catch {}
        }
        if (!memories.some((m) => m.id === note.id)) {
          const updated = [note, ...memories];
          localStorage.setItem('s17_memories', JSON.stringify(updated));

          // Update student roster score
          if (note.author) {
            const roster = getStoredRoster();
            const student = roster.find((s) => s.name.trim().toLowerCase() === note.author.trim().toLowerCase());
            if (student) {
              student.hasJoined = true;
              student.memoryNoteCount = (student.memoryNoteCount || 0) + 1;
              calculateAndUpdateScores(roster);
              saveRoster(roster, { skipRemotePublish: true });
            }
          }
          notifySync('MEMORY_ADDED', note, { skipRemotePublish: true });
          notifySync('STORE_UPDATE', null, { skipRemotePublish: true });
        }
      }
    } else if (action === 'GROUP_ENTRY_ADDED') {
      const entry = payload as GroupStrategyEntry;
      if (entry && entry.id && entry.groupName) {
        const saved = localStorage.getItem('s17_group_strategies');
        let entries: GroupStrategyEntry[] = [];
        if (saved) {
          try { entries = JSON.parse(saved); } catch {}
        }
        if (!entries.some((g) => g.id === entry.id)) {
          const updated = [entry, ...entries];
          localStorage.setItem('s17_group_strategies', JSON.stringify(updated));

          const roster = getStoredRoster();
          const student = roster.find((s) => entry.groupName.toLowerCase().includes(s.name.toLowerCase()));
          if (student) {
            student.hasJoined = true;
            student.groupContributionsCount = (student.groupContributionsCount || 0) + 1;
            calculateAndUpdateScores(roster);
            saveRoster(roster, { skipRemotePublish: true });
          }
          notifySync('GROUP_ENTRY_ADDED', entry, { skipRemotePublish: true });
        }
      }
    } else if (action === 'CARD_ADDED' || action === 'CARD_CREATED') {
      const card = payload as FinishWellCardData;
      if (card && card.id) {
        const cards = getStoredCards();
        if (!cards.some((c) => c.id === card.id)) {
          const updated = [card, ...cards];
          localStorage.setItem('s17_finish_well_cards', JSON.stringify(updated));

          const roster = getStoredRoster();
          const sender = roster.find((s) => s.name.trim().toLowerCase() === card.partnerName.trim().toLowerCase());
          if (sender) {
            sender.hasJoined = true;
            sender.cardsSentCount = (sender.cardsSentCount || 0) + 1;
            sender.cardRecipientName = card.recipientName;
            sender.cardSnippet = card.getThroughWhen || card.youAre;
            calculateAndUpdateScores(roster);
            saveRoster(roster, { skipRemotePublish: true });
          }
          notifySync('CARD_ADDED', card, { skipRemotePublish: true });
        }
      }
    } else if (action === 'REFLECTION_SAVED') {
      const { reflection, studentId, studentName } = payload || {};
      if (reflection) {
        const roster = getStoredRoster();
        const student = roster.find(
          (s) => (studentId && s.id === studentId) || (studentName && s.name.trim().toLowerCase() === studentName.trim().toLowerCase())
        );
        if (student) {
          student.hasJoined = true;
          student.reflectionCompleted = true;
          student.reflectionChannel = reflection.basicPhCommitment?.channel;
          student.reflectionText = reflection.basicPhCommitment?.description;
          calculateAndUpdateScores(roster);
          saveRoster(roster, { skipRemotePublish: true });
        }
        notifySync('REFLECTION_SAVED', reflection, { skipRemotePublish: true });
      }
    } else if (action === 'POLL_RESET') {
      const zeroTally = { manageable: 0, mixed: 0, heavy: 0 };
      localStorage.setItem('s17_sentiment_tally', JSON.stringify(zeroTally));
      localStorage.removeItem('s17_user_sentiment');
      const roster = getStoredRoster();
      roster.forEach((s) => {
        delete s.sentimentVote;
        delete s.sentimentTime;
      });
      calculateAndUpdateScores(roster);
      saveRoster(roster, { skipRemotePublish: true });
      notifySync('POLL_RESET', zeroTally, { skipRemotePublish: true });
    } else if (action === 'ROSTER_UPDATED') {
      if (Array.isArray(payload)) {
        localStorage.setItem('s17_student_roster', JSON.stringify(payload));
        notifySync('ROSTER_UPDATED', payload, { skipRemotePublish: true });
      }
    } else if (action === 'TRIGGER_CELEBRATION') {
      notifySync('TRIGGER_CELEBRATION', payload, { skipRemotePublish: true });
    }
  } catch (err) {
    console.error('Error applying remote action', err);
  }
};

// Start listening for remote cloud actions automatically in browser environments
if (typeof window !== 'undefined') {
  subscribeToRemoteActions(applyIncomingRemoteAction);
  // Boot live sync
  setTimeout(() => {
    startLiveSync();
  }, 100);
}

// STORAGE HELPERS - Maintains active S1-7 student namelist
export const getStoredRoster = (): StudentRosterItem[] => {
  if (typeof window === 'undefined') return [];

  // 1. HIGHEST PRIORITY: If URL has roster encoded from scanned teacher QR code
  try {
    const url = new URL(window.location.href);
    const rosterParam = 
      url.searchParams.get('r') || 
      url.searchParams.get('roster') || 
      url.searchParams.get('names') || 
      url.searchParams.get('class');

    if (rosterParam) {
      const names = decodeRosterFromParam(rosterParam);
      if (names.length > 0) {
        const scannedRoster = createRosterFromNames(names);
        try {
          localStorage.setItem('s17_student_roster', JSON.stringify(scannedRoster));
          localStorage.setItem('s17_user_mode', 'student');
        } catch {
          // ignore
        }
        return scannedRoster;
      }
    }

    // Also inspect hash in case scanner or router placed params after #
    if (window.location.hash) {
      const hashRaw = window.location.hash.replace(/^#\/?/, '');
      const queryIdx = hashRaw.indexOf('?');
      const hashStr = queryIdx >= 0 ? hashRaw.substring(queryIdx + 1) : hashRaw;
      const hashParams = new URLSearchParams(hashStr);
      const hashRoster = 
        hashParams.get('r') || 
        hashParams.get('roster') || 
        hashParams.get('names');

      if (hashRoster) {
        const names = decodeRosterFromParam(hashRoster);
        if (names.length > 0) {
          const scannedRoster = createRosterFromNames(names);
          try {
            localStorage.setItem('s17_student_roster', JSON.stringify(scannedRoster));
            localStorage.setItem('s17_user_mode', 'student');
          } catch {
            // ignore
          }
          return scannedRoster;
        }
      }
    }
  } catch (e) {
    console.warn('Could not parse roster from URL', e);
  }

  // 2. Read from localStorage on this device
  const saved = localStorage.getItem('s17_student_roster');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch {
      // fallback
    }
  }

  // 3. Default fallback: S1-7 official 28-student roster
  const initial: StudentRosterItem[] = INITIAL_S17_ROSTER.map((s, idx) => ({
    id: s.id || `s-${idx + 1}`,
    name: s.name,
    hasJoined: false,
    memoryNoteCount: 0,
    groupContributionsCount: 0,
    cardsSentCount: 0,
    reflectionCompleted: false,
    completionScore: 0,
  }));

  try {
    localStorage.setItem('s17_student_roster', JSON.stringify(initial));
  } catch {
    // ignore
  }
  return initial;
};

export const saveRoster = (roster: StudentRosterItem[], options?: { skipRemotePublish?: boolean }) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('s17_student_roster', JSON.stringify(roster));
  notifySync('ROSTER_UPDATED', roster, options);
};

/**
 * Creates StudentRosterItem objects from a plain string array of student names
 */
export const createRosterFromNames = (names: string[]): StudentRosterItem[] => {
  const seen = new Set<string>();
  const list: StudentRosterItem[] = [];

  names.forEach((rawName, index) => {
    const name = rawName.trim();
    if (!name) return;
    const key = name.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);

    list.push({
      id: `s-stu-${index + 1}`,
      name,
      hasJoined: false,
      memoryNoteCount: 0,
      groupContributionsCount: 0,
      cardsSentCount: 0,
      reflectionCompleted: false,
      completionScore: 0,
    });
  });

  return list;
};

/**
 * Compact URL encoder for cross-device roster synchronization on static hosts (like GitHub Pages)
 * Replaces whitespace with '+' and delimits with '~' to create ultra-compact URLs for fast QR scanning.
 */
export const encodeRosterToParam = (roster: StudentRosterItem[]): string => {
  try {
    const names = roster.map((s) => s.name.trim()).filter(Boolean);
    if (names.length === 0) return '';
    return names.map((n) => n.replace(/\s+/g, '+')).join('~');
  } catch {
    return '';
  }
};

/**
 * Compact URL decoder for cross-device roster synchronization
 * Supports '~', '|', ';', ',', and newline delimiters, plus '+' or '%20' spaces.
 */
export const decodeRosterFromParam = (param: string): string[] => {
  try {
    let raw = param;
    try {
      raw = decodeURIComponent(param);
    } catch {
      raw = param;
    }
    let parts: string[] = [];
    if (raw.includes('~')) {
      parts = raw.split('~');
    } else if (raw.includes('|')) {
      parts = raw.split('|');
    } else if (raw.includes('\n')) {
      parts = raw.split(/\r?\n/);
    } else if (raw.includes(';')) {
      parts = raw.split(';');
    } else if (raw.includes(',')) {
      parts = raw.split(',');
    } else {
      parts = [raw];
    }
    return parts
      .map((n) => n.replace(/\+/g, ' ').replace(/^[0-9]+[.)\s-]+/, '').trim())
      .filter((n) => n.length > 0 && !n.toLowerCase().includes('student name'));
  } catch {
    return [];
  }
};

/**
 * Build a full student join URL containing the encoded class list and live sync room for GitHub Pages
 */
export const buildStudentJoinUrl = (roster: StudentRosterItem[]): string => {
  if (typeof window === 'undefined') return '';
  const origin = window.location.origin;
  const pathname = window.location.pathname;
  const encoded = encodeRosterToParam(roster);
  const room = getLiveSyncRoom();
  const base = `${origin}${pathname}?mode=student&room=${encodeURIComponent(room)}`;
  return encoded ? `${base}&r=${encodeURIComponent(encoded)}` : base;
};

/**
 * Helper to check if current device/browser is in Student Participant Mode
 */
export const isStudentModeActive = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'teacher' || params.get('tab') === 'teacher' || params.get('role') === 'teacher') {
      localStorage.setItem('s17_user_mode', 'teacher');
      return false;
    }
    if (
      params.get('mode') === 'student' || 
      params.get('join') === 'true' || 
      params.get('role') === 'student' || 
      params.has('r') || 
      params.has('roster')
    ) {
      localStorage.setItem('s17_user_mode', 'student');
      return true;
    }
    const saved = localStorage.getItem('s17_user_mode');
    if (saved === 'student') return true;
    if (saved === 'teacher') return false;
  } catch {
    // ignore
  }
  return false;
};

/**
 * Auto-initialize roster on app load:
 * 1. Checks if ?r=... is in the URL search or hash (e.g. scanned from teacher QR code)
 * 2. Checks if a static class-list.txt exists on the server/GitHub Pages
 * 3. Falls back to stored roster or initial S1-7 roster
 */
export const initRosterFromUrlOrStorage = async (): Promise<StudentRosterItem[]> => {
  if (typeof window === 'undefined') return [];

  // 1. Check URL parameters
  try {
    const url = new URL(window.location.href);
    const rosterParam = 
      url.searchParams.get('r') || 
      url.searchParams.get('roster') || 
      url.searchParams.get('names') || 
      url.searchParams.get('class');

    if (rosterParam) {
      const names = decodeRosterFromParam(rosterParam);
      if (names.length > 0) {
        const updated = setRosterFromNamesText(names.join('\n'));
        return updated;
      }
    }

    // Also check hash in case of hash-based routing
    if (window.location.hash) {
      const hashStr = window.location.hash.replace(/^#\/?/, '');
      const queryIdx = hashStr.indexOf('?');
      const searchToParse = queryIdx >= 0 ? hashStr.substring(queryIdx + 1) : hashStr;
      const hashParams = new URLSearchParams(searchToParse);
      const hashRoster = hashParams.get('r') || hashParams.get('roster') || hashParams.get('names');
      if (hashRoster) {
        const names = decodeRosterFromParam(hashRoster);
        if (names.length > 0) {
          const updated = setRosterFromNamesText(names.join('\n'));
          return updated;
        }
      }
    }
  } catch (e) {
    console.warn('Could not parse roster from URL', e);
  }

  // 2. If stored roster is already populated, return it
  const current = getStoredRoster();
  if (current.length > 0) {
    return current;
  }

  // 3. Otherwise try fetching static class-list.txt / class-list.csv from GitHub Pages / public assets
  try {
    const baseUrl = (import.meta as any).env?.BASE_URL || '/';
    const endpoints = [
      `${baseUrl}class-list.txt`,
      `${baseUrl}class-list.csv`,
      './class-list.txt',
      './class-list.csv'
    ];

    for (const url of endpoints) {
      try {
        const res = await fetch(url);
        if (res.ok) {
          const text = await res.text();
          if (text && text.trim().length > 5 && !text.includes('<!DOCTYPE html>')) {
            const updated = setRosterFromNamesText(text);
            if (updated.length > 0) {
              return updated;
            }
          }
        }
      } catch {
        // continue trying
      }
    }
  } catch {
    // ignore
  }

  return getStoredRoster();
};

export const getCurrentStudent = (): StudentRosterItem | null => {
  if (typeof window === 'undefined') return null;
  const id = localStorage.getItem('s17_current_student_id');
  if (!id) return null;
  const roster = getStoredRoster();
  return roster.find((s) => s.id === id) || null;
};

export const setCurrentStudent = (studentId: string | null) => {
  if (typeof window === 'undefined') return;
  if (!studentId) {
    localStorage.removeItem('s17_current_student_id');
    localStorage.removeItem('s17_current_student_name');
    notifySync('STUDENT_LOGOUT');
    return;
  }
  localStorage.setItem('s17_current_student_id', studentId);
  const roster = getStoredRoster();
  const student = roster.find((s) => s.id === studentId);
  if (student) {
    localStorage.setItem('s17_current_student_name', student.name);
    // Mark as joined if not already
    if (!student.hasJoined) {
      student.hasJoined = true;
      student.joinedAt = Date.now();
      calculateAndUpdateScores(roster);
      saveRoster(roster);
    }
    // Broadcast student check in to teacher host screen
    notifySync('STUDENT_CHECK_IN', student);
  }
  notifySync('STUDENT_CHANGED', student);
};

// Calculate completion score (0 to 100)
export const calculateScore = (student: StudentRosterItem): number => {
  let score = 0;
  if (student.hasJoined) score += 15;
  if (student.sentimentVote) score += 20;
  if (student.memoryNoteCount > 0) score += 20;
  if (student.groupContributionsCount > 0) score += 15;
  if (student.cardsSentCount > 0) score += 15;
  if (student.reflectionCompleted) score += 15;
  return Math.min(100, score);
};

export const calculateAndUpdateScores = (roster: StudentRosterItem[]) => {
  roster.forEach((s) => {
    s.completionScore = calculateScore(s);
  });
};

// SENTIMENT TALLY - Start with 0 votes, no fake samples
export const getSentimentTally = (): { manageable: number; mixed: number; heavy: number } => {
  if (typeof window === 'undefined') return { manageable: 0, mixed: 0, heavy: 0 };
  const saved = localStorage.getItem('s17_sentiment_tally');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // If previous tally was the fake demo { manageable: 12, mixed: 18, heavy: 8 }, reset to 0
      if (parsed.manageable === 12 && parsed.mixed === 18 && parsed.heavy === 8) {
        return { manageable: 0, mixed: 0, heavy: 0 };
      }
      return parsed;
    } catch {
      // fallback
    }
  }
  return { manageable: 0, mixed: 0, heavy: 0 };
};

export const saveSentimentTally = (tally: { manageable: number; mixed: number; heavy: number }, options?: { skipRemotePublish?: boolean }) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('s17_sentiment_tally', JSON.stringify(tally));
  notifySync('TALLY_UPDATED', tally, options);
};

export const resetSentimentPoll = () => {
  if (typeof window === 'undefined') return;
  const zeroTally = { manageable: 0, mixed: 0, heavy: 0 };
  localStorage.setItem('s17_sentiment_tally', JSON.stringify(zeroTally));
  localStorage.removeItem('s17_user_sentiment');

  // Also clear sentiment votes from all roster items
  const roster = getStoredRoster();
  roster.forEach((s) => {
    delete s.sentimentVote;
    delete s.sentimentTime;
  });
  calculateAndUpdateScores(roster);
  saveRoster(roster);

  notifySync('POLL_RESET', zeroTally);
};

// RECORD STUDENT ACTIONS
export const recordSentimentVote = (type: SentimentType, studentId?: string) => {
  const currentId = studentId || localStorage.getItem('s17_current_student_id');
  const roster = getStoredRoster();
  const student = currentId ? roster.find((s) => s.id === currentId) : getCurrentStudent();
  const tally = getSentimentTally();
  const prevUserVote = localStorage.getItem('s17_user_sentiment') as SentimentType | null;

  // Broadcast specific vote payload across devices
  notifySync('VOTE_SENTIMENT', {
    vote: type,
    prevVote: prevUserVote,
    studentId: currentId || student?.id,
    studentName: student?.name,
    time: Date.now(),
  });

  if (prevUserVote && prevUserVote !== type) {
    tally[prevUserVote] = Math.max(0, tally[prevUserVote] - 1);
  }
  if (prevUserVote !== type) {
    tally[type] = tally[type] + 1;
  }
  localStorage.setItem('s17_user_sentiment', type);
  saveSentimentTally(tally, { skipRemotePublish: true });

  if (currentId) {
    const sObj = roster.find((s) => s.id === currentId);
    if (sObj) {
      sObj.hasJoined = true;
      if (!sObj.joinedAt) sObj.joinedAt = Date.now();
      sObj.sentimentVote = type;
      sObj.sentimentTime = Date.now();
      calculateAndUpdateScores(roster);
      saveRoster(roster, { skipRemotePublish: true });
    }
  }
};

export const recordMemoryNoteAdded = (authorName: string) => {
  const roster = getStoredRoster();
  const student = roster.find((s) => s.name.toLowerCase() === authorName.trim().toLowerCase()) 
    || getCurrentStudent();
  
  if (student) {
    student.memoryNoteCount = (student.memoryNoteCount || 0) + 1;
    student.hasJoined = true;
    calculateAndUpdateScores(roster);
    saveRoster(roster);
  }
};

export const saveNewMemoryNote = (note: MemoryNote) => {
  const saved = localStorage.getItem('s17_memories');
  let memories: MemoryNote[] = [];
  if (saved) {
    try { memories = JSON.parse(saved); } catch {}
  }
  const updated = [note, ...memories.filter((m) => m.id !== note.id)];
  localStorage.setItem('s17_memories', JSON.stringify(updated));
  recordMemoryNoteAdded(note.author);
  notifySync('MEMORY_NOTE_ADDED', note);
};

export const recordGroupContribution = (studentNameOrGroup: string) => {
  const roster = getStoredRoster();
  const student = roster.find((s) => studentNameOrGroup.toLowerCase().includes(s.name.toLowerCase())) 
    || getCurrentStudent();

  if (student) {
    student.groupContributionsCount = (student.groupContributionsCount || 0) + 1;
    student.hasJoined = true;
    calculateAndUpdateScores(roster);
    saveRoster(roster);
  }
};

export const saveNewGroupEntry = (entry: GroupStrategyEntry) => {
  const saved = localStorage.getItem('s17_group_strategies');
  let entries: GroupStrategyEntry[] = [];
  if (saved) {
    try { entries = JSON.parse(saved); } catch {}
  }
  const updated = [entry, ...entries.filter((g) => g.id !== entry.id)];
  localStorage.setItem('s17_group_strategies', JSON.stringify(updated));
  recordGroupContribution(entry.groupName);
  notifySync('GROUP_ENTRY_ADDED', entry);
};

export const recordFinishWellCardSent = (card: FinishWellCardData) => {
  const roster = getStoredRoster();
  const sender = roster.find((s) => s.name.toLowerCase() === card.partnerName.trim().toLowerCase()) 
    || getCurrentStudent();

  if (sender) {
    sender.cardsSentCount = (sender.cardsSentCount || 0) + 1;
    sender.cardRecipientName = card.recipientName;
    sender.cardSnippet = card.getThroughWhen || card.youAre;
    sender.hasJoined = true;
    calculateAndUpdateScores(roster);
    saveRoster(roster);
  }

  // Also save the card into s17_finish_well_cards list
  const savedCards = getStoredCards();
  const updatedCards = [card, ...savedCards.filter((c) => c.id !== card.id)];
  localStorage.setItem('s17_finish_well_cards', JSON.stringify(updatedCards));
  notifySync('CARD_ADDED', card);
};

export const recordIndividualReflection = (reflection: IndividualReflectionData, studentId?: string) => {
  const currentId = studentId || localStorage.getItem('s17_current_student_id');
  const roster = getStoredRoster();
  const student = currentId ? roster.find((s) => s.id === currentId) : getCurrentStudent();
  if (currentId) {
    const sObj = roster.find((s) => s.id === currentId);
    if (sObj) {
      sObj.reflectionCompleted = true;
      sObj.reflectionChannel = reflection.basicPhCommitment.channel;
      sObj.reflectionText = reflection.basicPhCommitment.description;
      sObj.hasJoined = true;
      calculateAndUpdateScores(roster);
      saveRoster(roster);
    }
  }
  notifySync('REFLECTION_SAVED', {
    reflection,
    studentId: currentId,
    studentName: student?.name,
  });
};

// GET ALL CARDS
export const getStoredCards = (): FinishWellCardData[] => {
  if (typeof window === 'undefined') return [];
  const saved = localStorage.getItem('s17_finish_well_cards');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // fallback
    }
  }
  return [];
};

// ADMINISTRATIVE DELETION
export const deleteMemoryNote = (id: string): MemoryNote[] => {
  const saved = localStorage.getItem('s17_memories');
  let memories: MemoryNote[] = [];
  if (saved) {
    try {
      memories = JSON.parse(saved);
    } catch {
      // ignore
    }
  }
  const updated = memories.filter((m) => m.id !== id);
  localStorage.setItem('s17_memories', JSON.stringify(updated));
  notifySync('MEMORY_DELETED', id);
  return updated;
};

// WHEEL OF NAMES STYLE NAMELIST SYNC
export const setRosterFromNamesText = (text: string): StudentRosterItem[] => {
  const currentRoster = getStoredRoster();
  const existingMap = new Map<string, StudentRosterItem>();
  currentRoster.forEach((item) => {
    existingMap.set(item.name.trim().toLowerCase(), item);
  });

  const lines = text
    .split(/\r?\n/)
    .map((l) => l.replace(/^[0-9]+[.)\s-]+/, '').trim()) // Strip leading numbering e.g. "1. " if pasted from list
    .filter((l) => l.length > 0);

  const seen = new Set<string>();
  const newRoster: StudentRosterItem[] = [];

  lines.forEach((name, index) => {
    const key = name.toLowerCase();
    if (seen.has(key)) return; // prevent exact duplicates in same list
    seen.add(key);

    const existing = existingMap.get(key);
    if (existing) {
      newRoster.push({
        ...existing,
        name, // retain current casing
      });
    } else {
      newRoster.push({
        id: `s-custom-${Date.now()}-${index}`,
        name,
        hasJoined: false,
        memoryNoteCount: 0,
        groupContributionsCount: 0,
        cardsSentCount: 0,
        reflectionCompleted: false,
        completionScore: 0,
      });
    }
  });

  calculateAndUpdateScores(newRoster);
  saveRoster(newRoster);
  return newRoster;
};

export const deleteGroupEntry = (id: string): GroupStrategyEntry[] => {
  const saved = localStorage.getItem('s17_group_strategies');
  let entries: GroupStrategyEntry[] = [];
  if (saved) {
    try {
      entries = JSON.parse(saved);
    } catch {
      // ignore
    }
  }
  const updated = entries.filter((g) => g.id !== id);
  localStorage.setItem('s17_group_strategies', JSON.stringify(updated));
  notifySync('GROUP_ENTRY_DELETED', id);
  return updated;
};

export const deleteFinishWellCard = (id: string): FinishWellCardData[] => {
  const cards = getStoredCards();
  const updated = cards.filter((c) => c.id !== id);
  localStorage.setItem('s17_finish_well_cards', JSON.stringify(updated));
  notifySync('CARD_DELETED', id);
  return updated;
};

// CSV EXPORT GENERATOR
export const exportParticipationCSV = (roster: StudentRosterItem[]): string => {
  const headers = [
    'Index',
    'Student Name',
    'Class',
    'Session Status',
    'Joined Timestamp',
    'Activity 1 Sentiment',
    'Activity 1 Vote Time',
    'Activity 1 Post-It Notes',
    'Activity 3 Group Submissions',
    'Activity 4 Card Recipient',
    'Activity 4 Card Encouragement Snippet',
    'Activity 4 Reflection Channel',
    'Activity 4 Reflection Commitment',
    'Participation Score (%)',
  ];

  const rows = roster.map((s, idx) => {
    const joinTimeStr = s.joinedAt ? new Date(s.joinedAt).toLocaleTimeString() : 'Not Joined';
    const voteTimeStr = s.sentimentTime ? new Date(s.sentimentTime).toLocaleTimeString() : '-';
    const sentimentStr = s.sentimentVote ? s.sentimentVote.toUpperCase() : 'None';
    const statusStr = s.hasJoined ? 'Active / Joined' : 'Absent / Not Checked In';
    const reflectionTextClean = (s.reflectionText || '-').replace(/"/g, '""');
    const cardSnippetClean = (s.cardSnippet || '-').replace(/"/g, '""');

    return [
      idx + 1,
      `"${s.name}"`,
      '"S1-7"',
      `"${statusStr}"`,
      `"${joinTimeStr}"`,
      `"${sentimentStr}"`,
      `"${voteTimeStr}"`,
      s.memoryNoteCount || 0,
      s.groupContributionsCount || 0,
      `"${s.cardRecipientName || '-'}"`,
      `"${cardSnippetClean}"`,
      `"${s.reflectionChannel || '-'}"`,
      `"${reflectionTextClean}"`,
      `${s.completionScore}%`,
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
};
