import React, { useState, useEffect } from 'react';
import { 
  HeartHandshake, 
  Smile, 
  Users, 
  Palette, 
  Brain, 
  Activity as ActivityIcon, 
  CheckCircle, 
  Sparkles, 
  Plus, 
  HelpCircle,
  Clock,
  FileX,
  MessageSquare,
  BatteryLow,
  ShieldAlert,
  ChevronDown,
  BookOpen,
  Trash2
} from 'lucide-react';
import { BASIC_PH_DATA, TERM_4_CHALLENGES } from '../data/cceData';
import { BasicPhCategory, GroupStrategyEntry } from '../types';
import { BoxBreathingGuide } from './BoxBreathingGuide';
import { BasicPhReferenceBox } from './BasicPhReferenceBox';
import { playTapSound } from '../utils/sound';
import { 
  recordGroupContribution, 
  saveNewGroupEntry,
  deleteGroupEntry, 
  subscribeToSync 
} from '../utils/sessionStore';

export const Part2BasicPh: React.FC = () => {
  const [selectedChannel, setSelectedChannel] = useState<BasicPhCategory>('B');
  const [activeChallengeId, setActiveChallengeId] = useState<string>('exam-overwhelm');

  // Group work entries stored in localStorage - Do not prefill with fake samples
  const [groupEntries, setGroupEntries] = useState<GroupStrategyEntry[]>(() => {
    const saved = localStorage.getItem('s17_group_strategies');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Filter out legacy demo sample
          return parsed.filter((g: any) => g.id !== 'grp-1');
        }
      } catch {
        // ignore
      }
    }
    return [];
  });

  // Sync with sessionStore and live remote events
  useEffect(() => {
    const handleStorage = () => {
      const saved = localStorage.getItem('s17_group_strategies');
      if (saved) {
        try { setGroupEntries(JSON.parse(saved)); } catch {}
      }
    };

    window.addEventListener('storage', handleStorage);

    const unsubscribe = subscribeToSync((action) => {
      if (action === 'GROUP_ENTRY_DELETED' || action === 'GROUP_ENTRY_ADDED' || action === 'STORE_UPDATE') {
        const saved = localStorage.getItem('s17_group_strategies');
        if (saved) {
          try { setGroupEntries(JSON.parse(saved)); } catch {}
        }
      }
    });
    return () => {
      window.removeEventListener('storage', handleStorage);
      unsubscribe();
    };
  }, []);

  // New Group Strategy Form State
  const [groupName, setGroupName] = useState('');
  const [newStrategyChannel, setNewStrategyChannel] = useState<BasicPhCategory>('C');
  const [newStrategyText, setNewStrategyText] = useState('');
  const [newStrategyReason, setNewStrategyReason] = useState('');
  const [currentStrategiesList, setCurrentStrategiesList] = useState<{ channel: BasicPhCategory; strategy: string; whyHelpful: string }[]>([]);

  const handleAddStrategyToList = () => {
    if (!newStrategyText.trim() || !newStrategyReason.trim()) return;
    playTapSound();
    setCurrentStrategiesList([
      ...currentStrategiesList,
      { channel: newStrategyChannel, strategy: newStrategyText.trim(), whyHelpful: newStrategyReason.trim() }
    ]);
    setNewStrategyText('');
    setNewStrategyReason('');
  };

  const handleSaveGroupSubmission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || currentStrategiesList.length === 0) return;
    playTapSound();

    const newEntry: GroupStrategyEntry = {
      id: `grp-${Date.now()}`,
      challengeId: activeChallengeId,
      groupName: groupName.trim(),
      strategies: currentStrategiesList,
      createdAt: Date.now(),
    };

    saveNewGroupEntry(newEntry);
    setGroupEntries((prev) => [newEntry, ...prev.filter((g) => g.id !== newEntry.id)]);

    setGroupName('');
    setCurrentStrategiesList([]);
  };

  const handleDeleteGroupEntry = (id: string) => {
    playTapSound();
    const updated = deleteGroupEntry(id);
    setGroupEntries(updated);
  };

  const iconMap: Record<string, React.ReactNode> = {
    HeartHandshake: <HeartHandshake className="w-6 h-6" />,
    Smile: <Smile className="w-6 h-6" />,
    Users: <Users className="w-6 h-6" />,
    Palette: <Palette className="w-6 h-6" />,
    Brain: <Brain className="w-6 h-6" />,
    Activity: <ActivityIcon className="w-6 h-6" />,
    Clock: <Clock className="w-5 h-5 text-amber-600" />,
    FileX: <FileX className="w-5 h-5 text-rose-600" />,
    MessageSquare: <MessageSquare className="w-5 h-5 text-indigo-600" />,
    BatteryLow: <BatteryLow className="w-5 h-5 text-slate-600" />,
    ShieldAlert: <ShieldAlert className="w-5 h-5 text-purple-600" />,
  };

  const activeChallenge = TERM_4_CHALLENGES.find((c) => c.id === activeChallengeId) || TERM_4_CHALLENGES[0];
  const activeChannelData = BASIC_PH_DATA.find((c) => c.letter === selectedChannel) || BASIC_PH_DATA[0];

  return (
    <div className="space-y-12">
      {/* 1. B.A.S.I.C. Ph Framework Recap (Slides 7-8) */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-100 text-purple-900 mb-2">
              <span>CCE Wellbeing Framework • Slides 7 & 8</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              The B.A.S.I.C. Ph Coping Framework
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              "The goal is not to avoid difficult feelings, but to recognize that we have different ways of responding to them."
            </p>
          </div>
        </div>

        {/* 6 Dimension Pills / Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6">
          {BASIC_PH_DATA.map((item) => {
            const isSelected = selectedChannel === item.letter;
            return (
              <button
                key={item.letter}
                onClick={() => {
                  playTapSound();
                  setSelectedChannel(item.letter);
                }}
                className={`p-4 rounded-2xl border-2 text-left transition-all flex flex-col justify-between min-h-[120px] ${
                  isSelected
                    ? 'border-slate-900 bg-slate-900 text-white shadow-md'
                    : `${item.bgLight} ${item.borderLight} text-slate-800 hover:scale-[1.02]`
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-base ${
                      isSelected ? 'bg-amber-400 text-slate-950' : 'bg-white shadow-xs'
                    }`}
                    style={{ color: isSelected ? '#000' : item.color }}
                  >
                    {item.letter}
                  </span>
                  {isSelected && <CheckCircle className="w-4 h-4 text-amber-400" />}
                </div>
                <div className="mt-2">
                  <span className={`text-xs font-bold block ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                    {item.title}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Dimension Detail Card */}
        <div className="mt-6 p-6 rounded-3xl bg-slate-50 border border-slate-200 grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          <div className="lg:col-span-1 border-b lg:border-b-0 lg:border-r border-slate-200 pb-4 lg:pb-0 lg:pr-6">
            <div className="flex items-center gap-3 mb-2">
              <span
                className="w-12 h-12 rounded-2xl text-white font-black text-2xl flex items-center justify-center shadow-sm"
                style={{ backgroundColor: activeChannelData.color }}
              >
                {activeChannelData.letter}
              </span>
              <div>
                <h3 className="text-xl font-extrabold text-slate-900">
                  {activeChannelData.title}
                </h3>
                <span className="text-xs font-semibold text-slate-500">
                  {activeChannelData.subtitle}
                </span>
              </div>
            </div>
            <p className="text-sm text-slate-600 mt-3 leading-relaxed">
              {activeChannelData.description}
            </p>
          </div>

          <div className="lg:col-span-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Practical Sec 1 Strategies:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {activeChannelData.examples.map((ex, idx) => (
                <div
                  key={idx}
                  className="bg-white p-3.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 flex items-start gap-2 shadow-2xs"
                >
                  <span
                    className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                    style={{ backgroundColor: activeChannelData.color }}
                  />
                  <span>{ex}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 2. Activity 2: Box Breathing Guide (Slide 9) */}
      <section>
        <BoxBreathingGuide />
      </section>

      {/* 3. Activity 3: Group Work Challenge & Strategy Matrix (Slides 10-12) */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-900 mb-2">
              <span>Activity 3 • 20:00 Mins (Groups of 3-4)</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Coping With Common Term 4 Challenges
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              Select one challenge faced by your group, explore 3 to 4 B.A.S.I.C. Ph strategies, and explain why they help.
            </p>
          </div>
        </div>

        {/* 6 Challenges Selector (Slide 11) */}
        <div className="mt-6">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            Step 1: Pick a Common Challenge
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {TERM_4_CHALLENGES.map((ch) => {
              const isSelected = activeChallengeId === ch.id;
              return (
                <button
                  key={ch.id}
                  onClick={() => {
                    playTapSound();
                    setActiveChallengeId(ch.id);
                  }}
                  className={`p-4 rounded-2xl border-2 text-left transition-all min-h-[95px] flex items-start gap-3 ${
                    isSelected
                      ? 'border-amber-500 bg-amber-50/70 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-white shadow-xs flex items-center justify-center shrink-0 mt-0.5">
                    {iconMap[ch.iconName] || <Brain className="w-5 h-5 text-slate-700" />}
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                      {ch.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                      {ch.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Interactive Group Strategy Workspace */}
        <div className="mt-8 pt-8 border-t border-slate-100 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left / Form: Group Brainstorming Input */}
          <div className="lg:col-span-6 bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-4">
            <div className="border-b border-slate-200 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 block">
                Step 2: Group Brainstorming
              </span>
              <h4 className="text-lg font-bold text-slate-900 mt-0.5">
                Selected: {activeChallenge.title}
              </h4>
            </div>

            {/* Reference Infographic: BASIC-Ph.png */}
            <BasicPhReferenceBox
              activeChannel={newStrategyChannel}
              onSelectChannel={(cat) => setNewStrategyChannel(cat as BasicPhCategory)}
            />

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Group Name or Table #
              </label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g. Group 4 / The Resilient S1-7"
                className="w-full p-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:ring-2 focus:ring-amber-400 focus:outline-hidden"
              />
            </div>

            {/* Strategy item entry */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
              <span className="text-xs font-bold text-slate-800 block">
                Add Coping Strategy (Pick 1 of B.A.S.I.C. Ph):
              </span>

              <div className="grid grid-cols-6 gap-1.5">
                {(['B', 'A', 'S', 'I', 'C', 'Ph'] as BasicPhCategory[]).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setNewStrategyChannel(cat)}
                    className={`py-1.5 rounded-lg text-xs font-extrabold transition ${
                      newStrategyChannel === cat
                        ? 'bg-slate-900 text-amber-300 ring-2 ring-amber-400'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  What specific coping action will you take?
                </label>
                <input
                  type="text"
                  value={newStrategyText}
                  onChange={(e) => setNewStrategyText(e.target.value)}
                  placeholder="e.g. Set a revision timer for 25 mins and take a 5 min stretch break..."
                  className="w-full p-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-400 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Why does your group think this will be helpful?
                </label>
                <input
                  type="text"
                  value={newStrategyReason}
                  onChange={(e) => setNewStrategyReason(e.target.value)}
                  placeholder="e.g. It keeps energy high and prevents getting burned out or sleepy..."
                  className="w-full p-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-400 focus:outline-hidden"
                />
              </div>

              <button
                type="button"
                onClick={handleAddStrategyToList}
                disabled={!newStrategyText.trim() || !newStrategyReason.trim()}
                className="w-full py-2 rounded-xl bg-slate-100 hover:bg-amber-100 hover:text-amber-900 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-40"
              >
                <Plus className="w-3.5 h-3.5" /> Add Strategy to Group List
              </button>
            </div>

            {/* List of currently drafted strategies */}
            {currentStrategiesList.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="text-xs font-bold text-slate-700 block">
                  Strategies in Group Draft ({currentStrategiesList.length}/4):
                </span>
                {currentStrategiesList.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-white border border-slate-200 text-xs">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-black text-[10px]">
                        Channel {item.channel}
                      </span>
                      <span className="font-bold text-slate-900">{item.strategy}</span>
                    </div>
                    <p className="text-slate-500 text-[11px]">Why: {item.whyHelpful}</p>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleSaveGroupSubmission}
                  disabled={!groupName.trim() || currentStrategiesList.length === 0}
                  className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm shadow-sm transition disabled:opacity-50"
                >
                  Submit Group Work to Class Matrix
                </button>
              </div>
            )}
          </div>

          {/* Right / Model & Class Strategies Showcase */}
          <div className="lg:col-span-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Model Strategies & Class Submissions
              </span>
              <span className="text-xs text-slate-400">
                Challenge: {activeChallenge.title.split(' ')[0]}...
              </span>
            </div>

            {/* Model Teacher Scaffolding */}
            <div className="bg-sky-50/70 rounded-2xl p-4 border border-sky-200">
              <span className="text-xs font-bold text-sky-900 flex items-center gap-1.5 mb-2">
                <BookOpen className="w-3.5 h-3.5" /> Scaffolded Model Coping Answers:
              </span>
              <div className="space-y-2.5">
                {activeChallenge.defaultStrategies.map((item, idx) => (
                  <div key={idx} className="bg-white p-3 rounded-xl border border-sky-100 text-xs">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-900 font-black text-[10px]">
                        {item.channel}
                      </span>
                      <span className="font-semibold text-slate-800">{item.action}</span>
                    </div>
                    <p className="text-slate-500 text-[11px] pl-6">
                      <strong>Why:</strong> {item.reason}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* User Submitted Group entries */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-700 block">
                Class Submissions for this Challenge:
              </span>
              {groupEntries
                .filter((e) => e.challengeId === activeChallengeId)
                .map((entry) => (
                  <div key={entry.id} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">{entry.groupName}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400">
                          {new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <button
                          onClick={() => handleDeleteGroupEntry(entry.id)}
                          className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition"
                          title="Delete entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    {entry.strategies.map((st, i) => (
                      <div key={i} className="text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded bg-amber-200 text-slate-900 font-black text-[10px]">
                            {st.channel}
                          </span>
                          <span className="font-medium text-slate-800">{st.strategy}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 pl-5">
                          <em>Why:</em> {st.whyHelpful}
                        </p>
                      </div>
                    ))}
                  </div>
                ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4. Slide 13: Key Learning Points Comic-Style Breakdown */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-md border border-slate-800">
        <div className="max-w-3xl mb-6">
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30">
            Key Learning Takeaways • Slide 13
          </span>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
            Coping Well is About Knowing Yourself
          </h3>
          <p className="text-slate-300 text-sm mt-1 leading-relaxed">
            The same challenge can feel very different depending on who you are. What helps your friend cope may not be what helps you — and that is completely fine.
          </p>
        </div>

        {/* 4 Illustrated Scenario Cards from Slide 13 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 flex flex-col justify-between">
            <div>
              <span className="text-2xl mb-2 block">🌙</span>
              <h4 className="font-bold text-sm text-amber-300 mb-1">
                Studying Late to Understand
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Some need quiet late-night review to grasp complex formulas peacefully.
              </p>
            </div>
            <span className="text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-700 font-mono">
              Channel: C + Ph Care
            </span>
          </div>

          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 flex flex-col justify-between">
            <div>
              <span className="text-2xl mb-2 block">🙋‍♂️</span>
              <h4 className="font-bold text-sm text-teal-300 mb-1">
                Seeking Guidance with Questions
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Others thrive by directly asking subject teachers for step-by-step clarity.
              </p>
            </div>
            <span className="text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-700 font-mono">
              Channel: S (Social Support)
            </span>
          </div>

          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 flex flex-col justify-between">
            <div>
              <span className="text-2xl mb-2 block">📋</span>
              <h4 className="font-bold text-sm text-sky-300 mb-1">
                Breaking Down Big Projects
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Chunking a big Geography project into research, draft, and final review checklists.
              </p>
            </div>
            <span className="text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-700 font-mono">
              Channel: C (Cognition)
            </span>
          </div>

          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 flex flex-col justify-between">
            <div>
              <span className="text-2xl mb-2 block">🧘</span>
              <h4 className="font-bold text-sm text-purple-300 mb-1">
                Staying Calm Under Pressure
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Using conscious breath control and steady self-talk in the exam hall.
              </p>
            </div>
            <span className="text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-700 font-mono">
              Channel: Ph + B (Values)
            </span>
          </div>
        </div>
      </section>
    </div>
  );
};
