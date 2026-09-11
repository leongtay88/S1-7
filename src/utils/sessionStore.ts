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

export const notifySync = (action: string, payload?: unknown) => {
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

// STORAGE HELPERS - Do not prefill names with fake samples
export const getStoredRoster = (): StudentRosterItem[] => {
  if (typeof window === 'undefined') return [];
  const saved = localStorage.getItem('s17_student_roster');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        // If the stored roster was the previous hardcoded fake sample list, clean it out
        const isDemoRoster = parsed.length === 28 && parsed[0]?.name === 'Sarah Lim Zhi Xuan' && parsed[1]?.name === 'Marcus Tan Jun Jie';
        if (!isDemoRoster) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
  }
  // Clean default: empty roster, waiting for teacher to paste their class namelist
  localStorage.setItem('s17_student_roster', JSON.stringify([]));
  return [];
};

export const saveRoster = (roster: StudentRosterItem[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('s17_student_roster', JSON.stringify(roster));
  notifySync('ROSTER_UPDATED', roster);
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

export const saveSentimentTally = (tally: { manageable: number; mixed: number; heavy: number }) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('s17_sentiment_tally', JSON.stringify(tally));
  notifySync('TALLY_UPDATED', tally);
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
  const tally = getSentimentTally();
  const prevUserVote = localStorage.getItem('s17_user_sentiment') as SentimentType | null;

  if (prevUserVote && prevUserVote !== type) {
    tally[prevUserVote] = Math.max(0, tally[prevUserVote] - 1);
  }
  if (prevUserVote !== type) {
    tally[type] = tally[type] + 1;
  }
  localStorage.setItem('s17_user_sentiment', type);
  saveSentimentTally(tally);

  if (currentId) {
    const roster = getStoredRoster();
    const student = roster.find((s) => s.id === currentId);
    if (student) {
      student.hasJoined = true;
      if (!student.joinedAt) student.joinedAt = Date.now();
      student.sentimentVote = type;
      student.sentimentTime = Date.now();
      calculateAndUpdateScores(roster);
      saveRoster(roster);
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
  if (currentId) {
    const roster = getStoredRoster();
    const student = roster.find((s) => s.id === currentId);
    if (student) {
      student.reflectionCompleted = true;
      student.reflectionChannel = reflection.basicPhCommitment.channel;
      student.reflectionText = reflection.basicPhCommitment.description;
      student.hasJoined = true;
      calculateAndUpdateScores(roster);
      saveRoster(roster);
    }
  }
  notifySync('REFLECTION_SAVED', reflection);
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
