import React from 'react';
import { ArrowRight, CheckCircle, Heart, Shield, Sparkles, Users, Clock, BookOpen, Layers } from 'lucide-react';
import { S17Logo } from './S17Logo';
import { ClassroomTimer } from './ClassroomTimer';
import { NavTab } from './HeaderNav';

interface LessonOverviewProps {
  onSelectTab: (tab: NavTab) => void;
}

export const LessonOverview: React.FC<LessonOverviewProps> = ({ onSelectTab }) => {
  return (
    <div className="space-y-12">
      {/* Hero Welcome Banner */}
      <section className="bg-gradient-to-br from-amber-400 via-amber-400 to-yellow-300 rounded-3xl p-6 sm:p-10 shadow-sm border border-amber-300 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl text-slate-950">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-slate-950 text-amber-300 shadow-2xs">
              <span>CCE Term 4 • Secondary 1-7</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-950 leading-tight">
              Term 4 Begins: Check-in & Finishing Well Together
            </h1>

            <p className="text-slate-900 font-medium text-sm sm:text-base leading-relaxed">
              Welcome back, Class S1-7! As we enter our final term of Secondary 1, we reflect on our shared growth, arm ourselves with practical <strong>B.A.S.I.C. Ph</strong> coping strategies, and exchange mutual affirmation through the <strong>Finish Well Card</strong>.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => onSelectTab('part1')}
                className="min-h-[48px] px-6 py-3 rounded-2xl bg-slate-950 hover:bg-slate-900 text-amber-300 font-bold text-sm flex items-center gap-2 shadow-md transition active:scale-95"
              >
                <span>Start Part 1: Emotional Check-in</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => onSelectTab('part3')}
                className="min-h-[48px] px-5 py-3 rounded-2xl bg-white/90 hover:bg-white text-slate-950 font-bold text-sm flex items-center gap-2 border border-slate-300 transition active:scale-95"
              >
                <span>Open Finish Well Card</span>
              </button>
            </div>
          </div>

          <div className="shrink-0 flex flex-col items-center">
            <div className="p-5 sm:p-7 bg-white/80 rounded-3xl backdrop-blur-md border-3 border-slate-950 shadow-xl hover:scale-105 transition-transform duration-300">
              <S17Logo size={260} className="w-56 h-56 sm:w-64 sm:h-64 md:w-72 md:h-72" />
            </div>
            <span className="mt-2.5 text-xs font-black uppercase tracking-widest text-slate-950 bg-amber-300/90 px-3 py-1 rounded-full border border-slate-900/40 shadow-2xs">
              Class 1-7 Identity
            </span>
          </div>
        </div>
      </section>

      {/* 3 Main Lesson Parts Overview */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Part 1 Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200 flex flex-col justify-between hover:border-amber-400 transition-all group">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 font-black text-sm flex items-center justify-center">
                P1
              </span>
              <span className="text-xs font-semibold text-slate-400">Activity 1 • 5m</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              Recognise Growth & Sentiments
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Check in on how we feel entering Term 4 (Manageable, Mixed, or Heavy) and reflect on collective class growth across Terms 1 to 3 on the Post-it wall.
            </p>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-100">
            <button
              onClick={() => onSelectTab('part1')}
              className="w-full min-h-[44px] py-2.5 rounded-xl bg-slate-50 group-hover:bg-amber-100 text-slate-800 group-hover:text-amber-950 font-bold text-xs flex items-center justify-center gap-1.5 transition"
            >
              <span>Go to Part 1</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Part 2 Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200 flex flex-col justify-between hover:border-purple-400 transition-all group">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-800 font-black text-sm flex items-center justify-center">
                P2
              </span>
              <span className="text-xs font-semibold text-slate-400">Activities 2 & 3 • 22m</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              B.A.S.I.C. Ph Coping Strategies
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Recap Beliefs, Affect, Social, Imagination, Cognition, and Physiology. Practice guided 4-4-4-4 Box Breathing and solve common Term 4 challenges in groups.
            </p>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-100">
            <button
              onClick={() => onSelectTab('part2')}
              className="w-full min-h-[44px] py-2.5 rounded-xl bg-slate-50 group-hover:bg-purple-100 text-slate-800 group-hover:text-purple-950 font-bold text-xs flex items-center justify-center gap-1.5 transition"
            >
              <span>Go to Part 2</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Part 3 Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200 flex flex-col justify-between hover:border-emerald-400 transition-all group">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 font-black text-sm flex items-center justify-center">
                P3
              </span>
              <span className="text-xs font-semibold text-slate-400">Activity 4 • 15m</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              Finish Well Card & Reflection
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Pair up using "Stand Up, Hand Up & Pair Up". Affirm your partner’s "I am, I can, I have" strengths, save your card as a PNG, and complete your individual reflection.
            </p>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-100">
            <button
              onClick={() => onSelectTab('part3')}
              className="w-full min-h-[44px] py-2.5 rounded-xl bg-slate-50 group-hover:bg-emerald-100 text-slate-800 group-hover:text-emerald-950 font-bold text-xs flex items-center justify-center gap-1.5 transition"
            >
              <span>Go to Part 3</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* Classroom Facilitator Timer Center */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-6">
          <ClassroomTimer initialMinutes={5} label="Class Activity Countdown Timer" />
        </div>

        <div className="lg:col-span-6 bg-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <BookOpen className="w-4 h-4" /> Singapore MOE CCE Facilitator Notes
          </div>
          <h4 className="text-lg font-bold text-white">
            Classroom Lesson Sequence
          </h4>
          <div className="space-y-2.5 text-xs sm:text-sm text-slate-300">
            <div className="flex items-start gap-2">
              <span className="px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 font-bold text-xs shrink-0 mt-0.5">
                05:00
              </span>
              <span><strong>Activity 1:</strong> Students tap emotional sentiment. Teacher affirms that difficult feelings are completely normal and points to past class resilience.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="px-2 py-0.5 rounded bg-teal-400/20 text-teal-300 font-bold text-xs shrink-0 mt-0.5">
                02:00
              </span>
              <span><strong>Activity 2:</strong> Whole-class guided 4-4-4-4 Box Breathing practice to anchor physical calm.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="px-2 py-0.5 rounded bg-purple-400/20 text-purple-300 font-bold text-xs shrink-0 mt-0.5">
                20:00
              </span>
              <span><strong>Activity 3:</strong> Groups of 3-4 pick a Term 4 challenge and map out 3 to 4 B.A.S.I.C. Ph coping actions.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="px-2 py-0.5 rounded bg-emerald-400/20 text-emerald-300 font-bold text-xs shrink-0 mt-0.5">
                15:00
              </span>
              <span><strong>Activity 4:</strong> "Stand Up, Hand Up & Pair Up" card exchange + 3-minute individual reflection.</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
