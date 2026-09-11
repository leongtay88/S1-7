import React, { useState, useEffect } from 'react';
import { ThumbsUp, HelpCircle, AlertTriangle, Plus, Heart, Sparkles, Filter, CheckCircle2, Trash2 } from 'lucide-react';
import { SentimentType, MemoryCategory, MemoryNote } from '../types';
import { STARTER_MEMORIES } from '../data/cceData';
import { playTapSound } from '../utils/sound';
import { S17Logo } from './S17Logo';
import { 
  recordSentimentVote, 
  recordMemoryNoteAdded, 
  saveNewMemoryNote,
  deleteMemoryNote, 
  getSentimentTally, 
  getCurrentStudent, 
  getStoredRoster,
  subscribeToSync 
} from '../utils/sessionStore';

export const Part1Sentiments: React.FC = () => {
  // Local storage for sentiments
  const [selectedSentiment, setSelectedSentiment] = useState<SentimentType | null>(() => {
    return (localStorage.getItem('s17_user_sentiment') as SentimentType) || null;
  });

  const [tally, setTally] = useState<{ manageable: number; mixed: number; heavy: number }>(getSentimentTally);

  // Current student from session
  const currentStudent = getCurrentStudent();

  // Memories Post-it Wall - Do not prefill with fake samples
  const [memories, setMemories] = useState<MemoryNote[]>(() => {
    const saved = localStorage.getItem('s17_memories');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Filter out any legacy starter fake memories
          const cleaned = parsed.filter(
            (m: any) => !['mem-1', 'mem-2', 'mem-3', 'mem-4', 'mem-5'].includes(m.id)
          );
          return cleaned;
        }
      } catch {
        // fallback
      }
    }
    return [];
  });

  const [filterCategory, setFilterCategory] = useState<MemoryCategory | 'all'>('all');
  const [newNoteText, setNewNoteText] = useState('');
  const [newNoteAuthor, setNewNoteAuthor] = useState(currentStudent ? currentStudent.name : '');
  const [newNoteCategory, setNewNoteCategory] = useState<MemoryCategory>('supporting');
  const [showAddModal, setShowAddModal] = useState(false);

  // Sync with cross-tab and remote live events
  useEffect(() => {
    const handleStorage = () => {
      const saved = localStorage.getItem('s17_memories');
      if (saved) {
        try { setMemories(JSON.parse(saved)); } catch {}
      }
      setTally(getSentimentTally());
    };

    window.addEventListener('storage', handleStorage);

    const unsubscribe = subscribeToSync((action, payload) => {
      if (action === 'POLL_RESET') {
        setSelectedSentiment(null);
        setTally({ manageable: 0, mixed: 0, heavy: 0 });
      } else if (action === 'TALLY_UPDATED') {
        setTally(getSentimentTally());
      } else if (action === 'MEMORY_DELETED' || action === 'MEMORY_ADDED' || action === 'MEMORY_NOTE_ADDED' || action === 'STORE_UPDATE') {
        const saved = localStorage.getItem('s17_memories');
        if (saved) {
          try { setMemories(JSON.parse(saved)); } catch {}
        }
      } else if (action === 'STUDENT_CHANGED') {
        const student = payload as { name: string };
        if (student && student.name) {
          setNewNoteAuthor(student.name);
        }
      }
    });

    return () => {
      window.removeEventListener('storage', handleStorage);
      unsubscribe();
    };
  }, []);

  const handleVote = (type: SentimentType) => {
    playTapSound();
    setSelectedSentiment(type);
    recordSentimentVote(type);
    setTally(getSentimentTally());
  };

  const handleAddMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    playTapSound();
    const colors: MemoryNote['color'][] = ['yellow', 'pink', 'blue', 'green', 'purple', 'orange'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const author = newNoteAuthor.trim() || (currentStudent ? currentStudent.name : 'S1-7 Student');

    const newNote: MemoryNote = {
      id: `mem-${Date.now()}`,
      category: newNoteCategory,
      author,
      text: newNoteText.trim(),
      likes: 1,
      color: randomColor,
    };

    saveNewMemoryNote(newNote);
    setMemories((prev) => [newNote, ...prev.filter((m) => m.id !== newNote.id)]);

    setNewNoteText('');
    setNewNoteAuthor(currentStudent ? currentStudent.name : '');
    setShowAddModal(false);
  };

  const handleDeletePost = (id: string) => {
    playTapSound();
    const updated = deleteMemoryNote(id);
    setMemories(updated);
  };

  const handleLike = (id: string) => {
    playTapSound();
    setMemories((prev) =>
      prev.map((m) => (m.id === id ? { ...m, likes: m.likes + 1 } : m))
    );
  };

  const totalVotes = tally.manageable + tally.mixed + tally.heavy;
  const manageablePct = Math.round((tally.manageable / totalVotes) * 100) || 0;
  const mixedPct = Math.round((tally.mixed / totalVotes) * 100) || 0;
  const heavyPct = Math.round((tally.heavy / totalVotes) * 100) || 0;

  const categories = [
    { id: 'all', label: 'All Reflections' },
    { id: 'supporting', label: '🤝 Supporting One Another' },
    { id: 'challenges', label: '🧩 Challenges We Faced' },
    { id: 'moments', label: '🎉 Moments We Shared' },
    { id: 'learning', label: '📚 Learning Together' },
    { id: 'changed', label: '🌱 Ways We Changed' },
  ];

  const filteredMemories = filterCategory === 'all'
    ? memories
    : memories.filter((m) => m.category === filterCategory);

  return (
    <div className="space-y-12">
      {/* Activity 1: Emotional Check-in */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-900 mb-2">
              <span>Activity 1 • 05:00 Mins</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              How Are We Entering Term 4?
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              Tap your honest feeling right now. Every feeling in S1-7 is valid and welcomed.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
            <span className="font-semibold text-slate-800">{totalVotes}</span> class responses logged
          </div>
        </div>

        {/* 3 Interactive Emotion Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {/* Option 1: Manageable */}
          <button
            onClick={() => handleVote('manageable')}
            className={`min-h-[160px] p-6 rounded-2xl text-left border-2 transition-all flex flex-col justify-between group relative overflow-hidden ${
              selectedSentiment === 'manageable'
                ? 'border-emerald-500 bg-emerald-50/70 shadow-md shadow-emerald-100 ring-2 ring-emerald-500/20'
                : 'border-slate-200 hover:border-emerald-300 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                <ThumbsUp className="w-7 h-7" />
              </div>
              {selectedSentiment === 'manageable' && (
                <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-200/80 px-2.5 py-1 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Your Choice
                </span>
              )}
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-slate-900 mt-3">
                Term 4 feels manageable
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Feeling ready, paced, or steady about the remaining weeks.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-between text-xs font-bold text-emerald-700">
              <span>{tally.manageable} students</span>
              <span>{manageablePct}%</span>
            </div>
          </button>

          {/* Option 2: Mixed Feelings */}
          <button
            onClick={() => handleVote('mixed')}
            className={`min-h-[160px] p-6 rounded-2xl text-left border-2 transition-all flex flex-col justify-between group relative overflow-hidden ${
              selectedSentiment === 'mixed'
                ? 'border-amber-500 bg-amber-50/70 shadow-md shadow-amber-100 ring-2 ring-amber-500/20'
                : 'border-slate-200 hover:border-amber-300 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                <HelpCircle className="w-7 h-7" />
              </div>
              {selectedSentiment === 'mixed' && (
                <span className="flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-200/80 px-2.5 py-1 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Your Choice
                </span>
              )}
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-slate-900 mt-3">
                Unsure / Mixed feelings
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Some days feel okay, other days feel uncertain or 50/50.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-between text-xs font-bold text-amber-800">
              <span>{tally.mixed} students</span>
              <span>{mixedPct}%</span>
            </div>
          </button>

          {/* Option 3: Challenging or Heavy */}
          <button
            onClick={() => handleVote('heavy')}
            className={`min-h-[160px] p-6 rounded-2xl text-left border-2 transition-all flex flex-col justify-between group relative overflow-hidden ${
              selectedSentiment === 'heavy'
                ? 'border-rose-500 bg-rose-50/70 shadow-md shadow-rose-100 ring-2 ring-rose-500/20'
                : 'border-slate-200 hover:border-rose-300 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                <AlertTriangle className="w-7 h-7" />
              </div>
              {selectedSentiment === 'heavy' && (
                <span className="flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-200/80 px-2.5 py-1 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Your Choice
                </span>
              )}
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-slate-900 mt-3">
                Already feels challenging / heavy
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Feeling stressed, tired, or worried about exam expectations.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-between text-xs font-bold text-rose-700">
              <span>{tally.heavy} students</span>
              <span>{heavyPct}%</span>
            </div>
          </button>
        </div>

        {/* Collective Class Tally Bar */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-2">
            <span>S1-7 Sentiment Distribution:</span>
            <span>{totalVotes} total responses</span>
          </div>
          <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
            <div
              className="bg-emerald-500 transition-all duration-700"
              style={{ width: `${manageablePct}%` }}
              title={`Manageable: ${manageablePct}%`}
            />
            <div
              className="bg-amber-400 transition-all duration-700"
              style={{ width: `${mixedPct}%` }}
              title={`Mixed: ${mixedPct}%`}
            />
            <div
              className="bg-rose-500 transition-all duration-700"
              style={{ width: `${heavyPct}%` }}
              title={`Challenging: ${heavyPct}%`}
            />
          </div>
        </div>

        {/* Key Normalizing Insight (from Slide 5) */}
        <div className="mt-6 bg-amber-50/80 rounded-2xl p-5 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-400 text-slate-900 flex items-center justify-center shrink-0 shadow-sm">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="space-y-1 text-sm text-slate-800">
            <p className="font-bold text-amber-950">
              Recognising Our Collective Growth as S1-7 (Term 1 to 3):
            </p>
            <p className="text-slate-700">
              • Some of us may have more difficult feelings about entering Term 4 — <strong>and that is completely okay</strong>.
            </p>
            <p className="text-slate-700">
              • This is not the first time we had to adjust and push through.
            </p>
            <p className="text-slate-700">
              • From Term 1 to Term 3, we have grown through our shared experiences — and that growth is something we carry forward.
            </p>
          </div>
        </div>
      </section>

      {/* Part 1b: Looking Back to Move Forward (Slide 4 Reflection Wall) */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-sky-100 text-sky-900 mb-2">
              <span>Looking Back to Move Forward • Slide 4 Reflection</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              How Have We Grown as a Class?
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              Think back about the experiences you shared across Terms 1 to 3. Post a memory to the class board!
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-amber-400 text-slate-950 hover:bg-amber-300 font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition active:scale-95 self-start lg:self-auto"
          >
            <Plus className="w-4 h-4" /> Add Post-it Note
          </button>
        </div>

        {/* 5 Guided Themes Filter Bar */}
        <div className="flex items-center gap-2 overflow-x-auto py-4 scrollbar-none">
          <Filter className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                playTapSound();
                setFilterCategory(cat.id as MemoryCategory | 'all');
              }}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                filterCategory === cat.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Post-it Notes Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-4">
          {filteredMemories.length === 0 ? (
            <div className="col-span-full py-12 px-6 rounded-3xl border-2 border-dashed border-slate-300 text-center bg-slate-50/70">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-3.5 shadow-2xs">
                <Sparkles className="w-7 h-7" />
              </div>
              <h4 className="text-base sm:text-lg font-black text-slate-900">
                No Reflection Notes Pinned Yet
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto mt-1.5 mb-5 font-medium">
                Be the first in Class S1-7 to pin a genuine memory, a challenge overcome, or a moment of mutual support from Terms 1 to 3!
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs sm:text-sm rounded-2xl shadow-sm transition active:scale-95"
              >
                <Plus className="w-4 h-4" /> Pin First Post-it Note
              </button>
            </div>
          ) : (
            filteredMemories.map((note) => {
            const colorStyles: Record<MemoryNote['color'], string> = {
              yellow: 'bg-amber-100/90 border-amber-300 text-amber-950',
              pink: 'bg-rose-100/90 border-rose-300 text-rose-950',
              blue: 'bg-sky-100/90 border-sky-300 text-sky-950',
              green: 'bg-emerald-100/90 border-emerald-300 text-emerald-950',
              purple: 'bg-purple-100/90 border-purple-300 text-purple-950',
              orange: 'bg-orange-100/90 border-orange-300 text-orange-950',
            };

            const categoryLabels: Record<MemoryCategory, string> = {
              supporting: '🤝 Supporting',
              challenges: '🧩 Challenges',
              moments: '🎉 Moments',
              learning: '📚 Learning',
              changed: '🌱 Growth',
            };

            return (
              <div
                key={note.id}
                className={`p-5 rounded-2xl border shadow-sm transition-all hover:-translate-y-1 hover:shadow-md flex flex-col justify-between min-h-[170px] ${colorStyles[note.color]}`}
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider opacity-75 mb-2">
                    <span>{categoryLabels[note.category]}</span>
                    <span>{note.author}</span>
                  </div>
                  <p className="text-sm font-medium leading-relaxed">
                    "{note.text}"
                  </p>
                </div>
                <div className="flex items-center justify-between pt-3 mt-2 border-t border-black/10 text-xs">
                  <span className="text-[11px] opacity-70">S1-7 Memory</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleDeletePost(note.id)}
                      className="p-1.5 rounded-full hover:bg-black/10 text-slate-500 hover:text-rose-600 transition"
                      title="Delete post"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleLike(note.id)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/70 hover:bg-white text-slate-800 font-semibold shadow-xs transition active:scale-95"
                      title="Give heart"
                    >
                      <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                      <span>{note.likes}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          }))}
        </div>

        {/* Modal for adding memory */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200">
              <h3 className="text-xl font-bold text-slate-900 mb-1">
                Add S1-7 Reflection Note
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                What is one memorable growth or supportive moment from Term 1–3?
              </p>

              <form onSubmit={handleAddMemory} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Select Theme
                  </label>
                  <select
                    value={newNoteCategory}
                    onChange={(e) => setNewNoteCategory(e.target.value as MemoryCategory)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-amber-400 focus:outline-hidden"
                  >
                    <option value="supporting">🤝 Supporting one another</option>
                    <option value="challenges">🧩 Challenges we faced</option>
                    <option value="moments">🎉 Moments we shared</option>
                    <option value="learning">📚 Learning together</option>
                    <option value="changed">🌱 Ways we have changed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Your Memory / Observation
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    placeholder="e.g. In Term 2 when we stayed back to help each other prepare for the Science practical..."
                    className="w-full p-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-400 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Your Name or Group (Optional)
                  </label>
                  {getStoredRoster().length > 0 && (
                    <div className="mb-2">
                      <select
                        value={getStoredRoster().some((s) => s.name === newNoteAuthor) ? newNoteAuthor : ''}
                        onChange={(e) => {
                          if (e.target.value) {
                            setNewNoteAuthor(e.target.value);
                          }
                        }}
                        className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-amber-50 text-slate-900 focus:ring-2 focus:ring-amber-400 focus:outline-hidden cursor-pointer"
                      >
                        <option value="">▼ Dropdown list: Choose student from roster ({getStoredRoster().length} students)...</option>
                        {getStoredRoster().map((s) => (
                          <option key={s.id} value={s.name}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <input
                    type="text"
                    value={newNoteAuthor}
                    onChange={(e) => setNewNoteAuthor(e.target.value)}
                    placeholder="e.g. Lucas, Group 4, or Anonymous"
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-400 focus:outline-hidden"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm shadow-sm"
                  >
                    Post to Board
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
