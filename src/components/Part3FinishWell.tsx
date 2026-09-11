import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Heart, 
  Plus, 
  Save, 
  Edit3, 
  Eye, 
  Check, 
  Share2, 
  Users, 
  Brain, 
  Compass, 
  Award,
  BookMarked,
  Download,
  RotateCcw,
  CheckCircle2,
  PartyPopper,
  X,
  Palette,
  ShieldCheck,
  Flame,
  Star,
  UserCheck,
  ChevronDown
} from 'lucide-react';
import html2canvas from 'html2canvas';
import confetti from 'canvas-confetti';
import { FinishWellCardData, IndividualReflectionData, BasicPhCategory, StudentRosterItem } from '../types';
import { STRENGTH_SUGGESTIONS, BASIC_PH_DATA } from '../data/cceData';
import { S17_LOGO_DATA_URI } from '../data/s17LogoData';
import { S17Logo } from './S17Logo';
import { playTapSound, playCelebrationFanfare, playResetSound } from '../utils/sound';
import { 
  getStoredRoster, 
  getCurrentStudent, 
  recordFinishWellCardSent, 
  recordIndividualReflection, 
  subscribeToSync 
} from '../utils/sessionStore';

interface ColorTheme {
  id: string;
  name: string;
  bgGradient: string;
  borderClass: string;
  badgeBg: string;
  badgeText: string;
  accentHex: string;
  headerHex: string;
}

const CARD_THEMES: ColorTheme[] = [
  {
    id: 'gold',
    name: 'S1-7 Sunlight Gold',
    bgGradient: 'from-amber-400 via-amber-300 to-yellow-200',
    borderClass: 'border-amber-400',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-950',
    accentHex: '#FFC907',
    headerHex: '#D97706',
  },
  {
    id: 'coral',
    name: 'Electric Coral Flame',
    bgGradient: 'from-rose-500 via-pink-500 to-orange-400',
    borderClass: 'border-rose-400',
    badgeBg: 'bg-rose-100',
    badgeText: 'text-rose-950',
    accentHex: '#FF006E',
    headerHex: '#E11D48',
  },
  {
    id: 'cyan',
    name: 'Cyber Cyan Dynamo',
    bgGradient: 'from-sky-400 via-cyan-400 to-teal-300',
    borderClass: 'border-sky-400',
    badgeBg: 'bg-sky-100',
    badgeText: 'text-sky-950',
    accentHex: '#00B4D8',
    headerHex: '#0284C7',
  },
  {
    id: 'emerald',
    name: 'Emerald Energy',
    bgGradient: 'from-emerald-400 via-teal-400 to-green-300',
    borderClass: 'border-emerald-400',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-950',
    accentHex: '#06D6A0',
    headerHex: '#059669',
  },
  {
    id: 'purple',
    name: 'Cosmic Violet Spark',
    bgGradient: 'from-purple-500 via-violet-500 to-fuchsia-400',
    borderClass: 'border-purple-400',
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-950',
    accentHex: '#8338EC',
    headerHex: '#7C3AED',
  },
];

export const Part3FinishWell: React.FC = () => {
  // Card ref for PNG export
  const cardRef = useRef<HTMLDivElement>(null);

  // Active theme
  const [activeThemeId, setActiveThemeId] = useState<string>('gold');
  const activeTheme = CARD_THEMES.find((t) => t.id === activeThemeId) || CARD_THEMES[0];

  // Saved cards list
  const [cards, setCards] = useState<FinishWellCardData[]>(() => {
    const saved = localStorage.getItem('s17_finish_well_cards');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return [
      {
        id: 'card-default',
        recipientName: 'Sarah Lim',
        className: 'Sec 1-7',
        youAre: 'Deeply thoughtful, patient, and an encouraging presence during team activities.',
        youCan: 'Organize revision topics systematically and stay focused even when math problems get tricky.',
        youHave: 'Supportive classmates in S1-7 who appreciate your kindness, plus caring teachers who believe in you.',
        getThroughWhen: 'You trust in your daily steady effort, remember to take breathing breaks, and do not let one difficult test shake your confidence.',
        partnerName: 'Marcus Tan',
        themeColor: '#FFC907',
        createdAt: Date.now(),
      }
    ];
  });

  const [activeCardId, setActiveCardId] = useState<string>(cards[0]?.id || 'card-default');
  const [isEditing, setIsEditing] = useState(true);

  // Form states with readable values
  const activeCard = cards.find((c) => c.id === activeCardId) || cards[0];

  const [recipientName, setRecipientName] = useState(activeCard?.recipientName || '');
  const [classNameVal, setClassNameVal] = useState(activeCard?.className || 'Sec 1-7');
  const [youAre, setYouAre] = useState(activeCard?.youAre || '');
  const [youCan, setYouCan] = useState(activeCard?.youCan || '');
  const [youHave, setYouHave] = useState(activeCard?.youHave || '');
  const [getThroughWhen, setGetThroughWhen] = useState(activeCard?.getThroughWhen || '');
  const [partnerName, setPartnerName] = useState(
    activeCard?.partnerName || (getCurrentStudent()?.name || '')
  );

  // Student roster & current student tracking
  const [roster, setRoster] = useState<StudentRosterItem[]>(getStoredRoster);
  const [currentStudent, setCurrentStudentState] = useState<StudentRosterItem | null>(getCurrentStudent);

  // UI state for celebration modal & export
  const [showCelebration, setShowCelebration] = useState(false);
  const [isExportingPNG, setIsExportingPNG] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // Individual Reflection state (Slide 19)
  const [reflection, setReflection] = useState<IndividualReflectionData>(() => {
    const saved = localStorage.getItem('s17_individual_reflection');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return {
      strengthToDrawOn: '',
      basicPhCommitment: {
        channel: 'Ph',
        description: '',
      },
      savedAt: 0,
    };
  });
  const [reflectionSaved, setReflectionSaved] = useState(false);

  useEffect(() => {
    localStorage.setItem('s17_finish_well_cards', JSON.stringify(cards));
  }, [cards]);

  // Sync roster and active student
  useEffect(() => {
    const unsubscribe = subscribeToSync((action, payload) => {
      if (action === 'ROSTER_UPDATED') {
        setRoster(getStoredRoster());
      } else if (action === 'STUDENT_CHANGED') {
        const student = payload as StudentRosterItem;
        setCurrentStudentState(student);
        if (!partnerName || partnerName === 'Your S1-7 Friend') {
          setPartnerName(student.name);
        }
      }
    });
    return () => unsubscribe();
  }, [partnerName]);

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => {
      setFeedbackToast(null);
    }, 3500);
  };

  const handleSelectCard = (id: string) => {
    const target = cards.find((c) => c.id === id);
    if (!target) return;
    setActiveCardId(id);
    setRecipientName(target.recipientName);
    setClassNameVal(target.className);
    setYouAre(target.youAre);
    setYouCan(target.youCan);
    setYouHave(target.youHave);
    setGetThroughWhen(target.getThroughWhen);
    setPartnerName(target.partnerName);
    setIsEditing(false);
  };

  // Helper to persist current form state into cards array
  const persistCard = () => {
    const updatedCard: FinishWellCardData = {
      id: activeCardId,
      recipientName: recipientName.trim() || 'My Classmate',
      className: classNameVal.trim() || 'Sec 1-7',
      youAre: youAre.trim(),
      youCan: youCan.trim(),
      youHave: youHave.trim(),
      getThroughWhen: getThroughWhen.trim(),
      partnerName: partnerName.trim() || 'Your S1-7 Friend',
      themeColor: activeTheme.accentHex,
      createdAt: Date.now(),
    };

    const exists = cards.some((c) => c.id === activeCardId);
    let newCards: FinishWellCardData[];
    if (exists) {
      newCards = cards.map((c) => (c.id === activeCardId ? updatedCard : c));
    } else {
      newCards = [updatedCard, ...cards];
    }
    setCards(newCards);
  };

  // "Complete" Button: Triggers celebratory fanfare sound, confetti, and celebration modal
  const handleComplete = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    persistCard();
    setIsEditing(false);

    // Track card completion in session participation store
    const updatedCard: FinishWellCardData = {
      id: activeCardId,
      recipientName: recipientName.trim() || 'Classmate',
      className: classNameVal.trim() || 'Sec 1-7',
      youAre: youAre.trim(),
      youCan: youCan.trim(),
      youHave: youHave.trim(),
      getThroughWhen: getThroughWhen.trim(),
      partnerName: partnerName.trim() || (currentStudent ? currentStudent.name : 'Your S1-7 Friend'),
      themeColor: activeTheme.accentHex,
      createdAt: Date.now(),
    };
    recordFinishWellCardSent(updatedCard);

    // Play triumphant celebration fanfare sound effect!
    playCelebrationFanfare();

    // Trigger full screen vibrant confetti cannon!
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FFC907', '#FF006E', '#00B4D8', '#06D6A0', '#8338EC', '#FF5722'],
      });
      setTimeout(() => {
        confetti({
          particleCount: 60,
          angle: 60,
          spread: 60,
          origin: { x: 0.1, y: 0.7 },
          colors: ['#FFC907', '#00B4D8', '#FF006E'],
        });
        confetti({
          particleCount: 60,
          angle: 120,
          spread: 60,
          origin: { x: 0.9, y: 0.7 },
          colors: ['#06D6A0', '#8338EC', '#FFC907'],
        });
      }, 250);
    } catch {
      // ignore
    }

    setShowCelebration(true);
    showToast(`🎉 Card for ${recipientName || 'your friend'} successfully completed!`);
  };

  // "Try Again" Button: Resets form fields so students can start fresh
  const handleTryAgain = () => {
    playResetSound();
    setRecipientName('');
    setClassNameVal('Sec 1-7');
    setYouAre('');
    setYouCan('');
    setYouHave('');
    setGetThroughWhen('');
    setPartnerName('');
    setIsEditing(true);
    setShowCelebration(false);
    showToast('✨ Form reset! Ready to write a new Finish Well Card!');
  };

  // Create new blank card
  const handleCreateNewCard = () => {
    playTapSound();
    const newId = `card-${Date.now()}`;
    setActiveCardId(newId);
    setRecipientName('');
    setClassNameVal('Sec 1-7');
    setYouAre('');
    setYouCan('');
    setYouHave('');
    setGetThroughWhen('');
    setPartnerName(currentStudent ? currentStudent.name : '');
    setIsEditing(true);
  };

  // Canvas Drawing Utilities for High-Energy Vibrant Card Export
  const drawRoundedRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  };

  const drawStarSparkle = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    spikes: number,
    outerRadius: number,
    innerRadius: number,
    color: string
  ) => {
    let rot = (Math.PI / 2) * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  };

  const drawWrappedText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number,
    maxLines: number = 2
  ): number => {
    if (!text) return y;
    const words = text.split(' ');
    let line = '';
    let currentY = y;
    let linesCount = 0;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line.trim(), x, currentY);
        line = words[n] + ' ';
        currentY += lineHeight;
        linesCount++;
        if (linesCount >= maxLines - 1 && n < words.length - 1) {
          const remaining = words.slice(n).join(' ');
          let fitText = remaining;
          while (ctx.measureText(fitText + '...').width > maxWidth && fitText.length > 0) {
            fitText = fitText.slice(0, -1);
          }
          ctx.fillText(fitText.trim() + '...', x, currentY);
          return currentY + lineHeight;
        }
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line.trim(), x, currentY);
    return currentY + lineHeight;
  };

  // Vibrant high-energy Canvas 2D image renderer
  const renderVibrantCardCanvas = async (canvas: HTMLCanvasElement) => {
    canvas.width = 1200;
    canvas.height = 920;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Outer subtle canvas
    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(0, 0, 1200, 920);

    // Neo-brutalist solid black drop shadow (10px offset)
    ctx.fillStyle = '#0F172A';
    drawRoundedRect(ctx, 60, 60, 1080, 800, 30);
    ctx.fill();

    // Main Card Body (Crisp white canvas)
    ctx.fillStyle = '#FFFFFF';
    drawRoundedRect(ctx, 50, 50, 1080, 800, 30);
    ctx.fill();

    // 5px Solid Neo-Brutalist Border
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 5;
    ctx.stroke();

    // Top Energy Accent Bar (Matches chosen theme: Sunlight Gold, Electric Coral, Cyber Cyan, etc.)
    ctx.save();
    drawRoundedRect(ctx, 50, 50, 1080, 800, 30);
    ctx.clip();
    ctx.fillStyle = activeTheme.accentHex;
    ctx.fillRect(50, 50, 1080, 26);
    ctx.restore();

    // Top Badge: "★ SEC 1-7 AFFIRMATION CARD"
    ctx.fillStyle = '#0F172A';
    drawRoundedRect(ctx, 85, 95, 270, 36, 10);
    ctx.fill();
    ctx.fillStyle = '#FDE047';
    ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
    ctx.fillText('★  SEC 1-7 AFFIRMATION CARD', 105, 118);

    // Main Title: "Finish Well Card" in high-contrast black
    ctx.fillStyle = '#0F172A';
    ctx.font = '900 44px system-ui, -apple-system, sans-serif';
    ctx.fillText('Finish Well Card', 85, 175);

    // Recipient Line: "To:" with Amber Pill
    ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#0F172A';
    ctx.fillText('To:', 85, 222);

    const recipientDisplay = recipientName || 'Classmate';
    ctx.font = '900 24px system-ui, -apple-system, sans-serif';
    const nameWidth = Math.max(220, ctx.measureText(recipientDisplay).width + 36);

    ctx.fillStyle = '#FEF3C7';
    drawRoundedRect(ctx, 128, 196, nameWidth, 38, 10);
    ctx.fill();
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.fillStyle = '#0F172A';
    ctx.fillText(recipientDisplay, 146, 223);

    // Class Pill: "Class: Sec 1-7"
    const secX = 128 + nameWidth + 24;
    ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#0F172A';
    ctx.fillText('Class:', secX, 222);

    ctx.fillStyle = '#FEF3C7';
    drawRoundedRect(ctx, secX + 68, 196, 120, 38, 10);
    ctx.fill();
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.fillStyle = '#0F172A';
    ctx.font = '900 22px system-ui, -apple-system, sans-serif';
    ctx.fillText(classNameVal || 'Sec 1-7', secX + 82, 223);

    // --- Right Header: S1-7 Class Logo & Resilience Tri-Color Pie ON A SINGLE LINE ---
    // Single line layout with clean breathing space between S1-7 Logo and Resilience Badge (matching Image 2)
    // 1. S1-7 Class Logo on its own without the rounded square frame
    const logoX = 765;
    const logoY = 82;
    const logoW = 160;
    const logoH = 160;

    try {
      const logoImg = new Image();
      logoImg.src = S17_LOGO_DATA_URI;
      if (!logoImg.complete) {
        await new Promise<void>((resolve) => {
          logoImg.onload = () => resolve();
          logoImg.onerror = () => resolve();
        });
      }
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(logoImg, logoX, logoY, logoW, logoH);
    } catch {
      // Fallback text if image cannot be rendered
      ctx.fillStyle = '#FBBF24';
      ctx.beginPath();
      ctx.arc(logoX + logoW / 2, logoY + logoH / 2, 65, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0F172A';
      ctx.font = '900 34px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('S1-7', logoX + logoW / 2, logoY + logoH / 2 + 12);
      ctx.textAlign = 'left';
    }

    // 2. Resilience Tri-color Pie Badge (I am, I can, I have) - spaced apart with clear margin (matching Image 2)
    const pieX = 1025;
    const pieY = 162;
    const pieR = 50;

    // Drop shadow
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.arc(pieX + 4, pieY + 4, pieR, 0, Math.PI * 2);
    ctx.fill();

    // Slice 1: I am (Emerald #4ADE80) - top-right (from -90 deg to 30 deg)
    ctx.beginPath();
    ctx.moveTo(pieX, pieY);
    ctx.arc(pieX, pieY, pieR, -Math.PI / 2, Math.PI / 6);
    ctx.closePath();
    ctx.fillStyle = '#4ADE80';
    ctx.fill();

    // Slice 2: I can (Sky #38BDF8) - bottom (from 30 deg to 150 deg)
    ctx.beginPath();
    ctx.moveTo(pieX, pieY);
    ctx.arc(pieX, pieY, pieR, Math.PI / 6, (5 * Math.PI) / 6);
    ctx.closePath();
    ctx.fillStyle = '#38BDF8';
    ctx.fill();

    // Slice 3: I have (Orange #FB923C) - top-left (from 150 deg to 270 deg / -90 deg)
    ctx.beginPath();
    ctx.moveTo(pieX, pieY);
    ctx.arc(pieX, pieY, pieR, (5 * Math.PI) / 6, (3 * Math.PI) / 2);
    ctx.closePath();
    ctx.fillStyle = '#FB923C';
    ctx.fill();

    // Outer circular dark border
    ctx.beginPath();
    ctx.arc(pieX, pieY, pieR, 0, Math.PI * 2);
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 3.5;
    ctx.stroke();

    // Slices divider lines meeting at center
    ctx.beginPath();
    // Up to top (angle -Math.PI/2)
    ctx.moveTo(pieX, pieY);
    ctx.lineTo(pieX, pieY - pieR);
    // To 30 deg (Math.PI/6)
    ctx.moveTo(pieX, pieY);
    ctx.lineTo(pieX + pieR * Math.cos(Math.PI / 6), pieY + pieR * Math.sin(Math.PI / 6));
    // To 150 deg (5*Math.PI/6)
    ctx.moveTo(pieX, pieY);
    ctx.lineTo(pieX + pieR * Math.cos((5 * Math.PI) / 6), pieY + pieR * Math.sin((5 * Math.PI) / 6));
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Center text: I am / I can / I have (no white donut, exactly as in Image 2)
    ctx.fillStyle = '#0F172A';
    ctx.font = '900 15px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('I am', pieX, pieY - 17);
    ctx.fillText('I can', pieX, pieY);
    ctx.fillText('I have', pieX, pieY + 17);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';

    // Divider line
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(85, 252);
    ctx.lineTo(1095, 252);
    ctx.stroke();

    // Section 1 Heading
    ctx.fillStyle = '#334155';
    ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
    ctx.fillText(
      '1. When I consider the “I am (belief), I can (skills), I have (support)”, I have observed these to be your strengths:',
      85,
      282
    );

    // Strengths Box Container
    ctx.fillStyle = '#F8FAFC';
    drawRoundedRect(ctx, 85, 300, 1010, 255, 20);
    ctx.fill();
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Row 1: YOU ARE
    ctx.fillStyle = '#FFE4E6';
    drawRoundedRect(ctx, 105, 318, 120, 28, 8);
    ctx.fill();
    ctx.strokeStyle = '#F43F5E';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#BE123C';
    ctx.font = '900 13px system-ui, -apple-system, sans-serif';
    ctx.fillText('YOU ARE:', 125, 337);

    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
    drawWrappedText(ctx, youAre || 'Thoughtful, resilient, and an encouraging presence to classmates.', 105, 372, 970, 24, 2);

    // Row 2: YOU CAN
    ctx.fillStyle = '#D1FAE5';
    drawRoundedRect(ctx, 105, 398, 120, 28, 8);
    ctx.fill();
    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#047857';
    ctx.font = '900 13px system-ui, -apple-system, sans-serif';
    ctx.fillText('YOU CAN:', 125, 417);

    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
    drawWrappedText(ctx, youCan || 'Organize revision systematically and stay focused under pressure.', 105, 452, 970, 24, 2);

    // Row 3: YOU HAVE
    ctx.fillStyle = '#E0F2FE';
    drawRoundedRect(ctx, 105, 478, 130, 28, 8);
    ctx.fill();
    ctx.strokeStyle = '#0284C7';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#0369A1';
    ctx.font = '900 13px system-ui, -apple-system, sans-serif';
    ctx.fillText('YOU HAVE:', 125, 497);

    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
    drawWrappedText(ctx, youHave || 'Supportive S1-7 friends and teachers who genuinely believe in you.', 105, 532, 970, 24, 2);

    // Section 2 Container (Encouragement)
    ctx.fillStyle = '#FEF3C7';
    drawRoundedRect(ctx, 85, 575, 1010, 145, 20);
    ctx.fill();
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.fillStyle = '#0F172A';
    ctx.font = '900 15px system-ui, -apple-system, sans-serif';
    ctx.fillText('2. YOU CAN GET THROUGH TERM 4 WHEN YOU...', 108, 608);

    ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#0F172A';
    drawWrappedText(
      ctx,
      getThroughWhen || 'Remember to take steady steps, breathe calmly, and know that our class stands with you!',
      108,
      646,
      960,
      28,
      3
    );

    // Footer Divider
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(85, 742);
    ctx.lineTo(1095, 742);
    ctx.stroke();

    // Footer S1-7 Badge
    ctx.fillStyle = '#0F172A';
    drawRoundedRect(ctx, 85, 762, 50, 26, 6);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 13px system-ui, -apple-system, sans-serif';
    ctx.fillText('S1-7', 95, 780);

    ctx.fillStyle = '#64748B';
    ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
    ctx.fillText('Learning to Learn and Grow Together', 145, 780);

    // Sign-off: Wishing you the best, [PartnerName]
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
    ctx.fillText('Wishing you the best,', 740, 780);

    const pName = partnerName || 'Your S1-7 Friend';
    ctx.fillStyle = '#0F172A';
    ctx.font = '900 20px system-ui, -apple-system, sans-serif';
    ctx.fillText(pName, 915, 780);

    // Underline for partner name
    const pWidth = ctx.measureText(pName).width;
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(915, 786);
    ctx.lineTo(915 + pWidth + 10, 786);
    ctx.stroke();

    // Decorative Star Sparkles in corners
    drawStarSparkle(ctx, 70, 70, 4, 10, 4, '#FBBF24');
    drawStarSparkle(ctx, 1110, 70, 4, 10, 4, '#38BDF8');
  };

  // Export card as PNG file - Matches Vibrant Live Preview Exactly
  const handleSaveAsPNG = async () => {
    playTapSound();
    setIsExportingPNG(true);

    const safeFileName = `S1-7_Finish_Well_Card_${(recipientName || 'Classmate').replace(/[^a-zA-Z0-9_-]/g, '_')}.png`;

    try {
      const canvas = document.createElement('canvas');
      await renderVibrantCardCanvas(canvas);

      const imageURI = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = safeFileName;
      downloadLink.href = imageURI;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      // Track completion in session store
      persistCard();
      recordFinishWellCardSent({
        id: activeCardId,
        recipientName: recipientName.trim() || 'Classmate',
        className: classNameVal.trim() || 'Sec 1-7',
        youAre: youAre.trim(),
        youCan: youCan.trim(),
        youHave: youHave.trim(),
        getThroughWhen: getThroughWhen.trim(),
        partnerName: partnerName.trim() || (currentStudent ? currentStudent.name : 'Your S1-7 Friend'),
        themeColor: activeTheme.accentHex,
        createdAt: Date.now(),
      });

      playCelebrationFanfare();
      showToast('📥 Vibrant Finish Well Card saved to your downloads / photos!');
    } catch (err) {
      console.warn('Canvas export failed, attempting html2canvas fallback:', err);
      try {
        const cardElement = cardRef.current;
        if (cardElement) {
          const fallbackCanvas = await html2canvas(cardElement, {
            scale: 2,
            backgroundColor: '#FFFFFF',
            logging: false,
            useCORS: true,
            allowTaint: true,
          });
          const imageURI = fallbackCanvas.toDataURL('image/png');
          const downloadLink = document.createElement('a');
          downloadLink.download = safeFileName;
          downloadLink.href = imageURI;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
          showToast('📥 Saved PNG successfully!');
        }
      } catch {
        showToast('⚠️ Could not save image automatically.');
      }
    } finally {
      setIsExportingPNG(false);
    }
  };

  const handleSaveReflection = (e: React.FormEvent) => {
    e.preventDefault();
    playTapSound();
    const updated = {
      ...reflection,
      savedAt: Date.now(),
    };
    setReflection(updated);
    localStorage.setItem('s17_individual_reflection', JSON.stringify(updated));
    recordIndividualReflection(updated);
    setReflectionSaved(true);
    showToast('✨ Individual reflection recorded successfully!');
    setTimeout(() => setReflectionSaved(false), 3000);
  };

  return (
    <div className="space-y-12">
      {/* Toast notification */}
      {feedbackToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-slate-950 text-white px-6 py-3 rounded-2xl shadow-2xl border-2 border-amber-400 font-bold text-sm sm:text-base flex items-center gap-2 animate-bounce">
          <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
          <span>{feedbackToast}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* 🌟 1. S1-7 CLASS IDENTITY LOGO & PLACEHOLDER AT TOP 🌟 */}
      {/* ======================================================== */}
      <section className="bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-300 rounded-3xl p-6 sm:p-8 border-4 border-slate-900 shadow-[6px_6px_0px_#0F172A] relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            {/* Class Logo Placeholder Box */}
            <div className="p-3.5 bg-white rounded-3xl border-3 border-slate-900 shadow-[4px_4px_0px_#0F172A] shrink-0 hover:rotate-2 transition-transform">
              <S17Logo size={96} showSubtitle={true} />
            </div>

            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-slate-950 text-amber-300 shadow-xs">
                <ShieldCheck className="w-4 h-4 text-amber-300" />
                <span>CLASS S1-7 OFFICIAL IDENTITY</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-950">
                Finish Well Digital Card
              </h1>
              <p className="text-slate-900 font-bold text-base sm:text-lg">
                Secondary 1-7 • <span className="underline decoration-slate-950 decoration-2">Learning to Learn and Grow Together</span>
              </p>
            </div>
          </div>

          {/* Theme Palette Switcher to delight Sec 1 students */}
          <div className="bg-white/95 p-4 rounded-2xl border-3 border-slate-900 shadow-[3px_3px_0px_#0F172A] flex flex-col items-center sm:items-end gap-2 shrink-0">
            <div className="flex items-center gap-1.5 text-xs font-black text-slate-900 uppercase tracking-wide">
              <Palette className="w-4 h-4 text-amber-600" />
              <span>Card Energy Accent:</span>
            </div>
            <div className="flex items-center gap-2">
              {CARD_THEMES.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => {
                    playTapSound();
                    setActiveThemeId(theme.id);
                  }}
                  className={`w-8 h-8 rounded-full border-2 border-slate-900 transition-all transform ${
                    activeThemeId === theme.id ? 'scale-125 ring-2 ring-slate-900 shadow-sm' : 'hover:scale-110 opacity-75'
                  }`}
                  style={{ backgroundColor: theme.accentHex }}
                  title={theme.name}
                  aria-label={`Select ${theme.name}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 2. ACTIVITY CONTROL BAR & CARD WORKBENCH */}
      {/* ======================================================== */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border-3 border-slate-900 shadow-[6px_6px_0px_#0F172A]">
        {/* Header with high energy text & instruction */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-6 border-b-2 border-slate-200">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider bg-rose-100 text-rose-950 border-2 border-rose-300 mb-2">
              <PartyPopper className="w-4 h-4 text-rose-600" />
              <span>Activity 4 • "Stand Up, Hand Up & Pair Up" (15:00 Mins)</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-950 tracking-tight">
              Celebrate Strengths & Encourage Your Classmate
            </h2>
            <p className="text-slate-600 font-medium text-base sm:text-lg mt-1 max-w-3xl">
              Spot the greatness in your S1-7 friend using <strong>"YOU ARE (Beliefs), YOU CAN (Skills), YOU HAVE (Support)"</strong>. Then click <strong>Complete</strong> or <strong>Save as PNG</strong>!
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                playTapSound();
                setIsEditing(!isEditing);
              }}
              className="min-h-[48px] px-5 py-2.5 rounded-2xl border-2 border-slate-900 bg-slate-100 hover:bg-slate-200 text-slate-950 font-black text-sm flex items-center gap-2 transition active:scale-95 shadow-[2px_2px_0px_#0F172A]"
            >
              {isEditing ? <Eye className="w-5 h-5 text-indigo-600" /> : <Edit3 className="w-5 h-5 text-indigo-600" />}
              <span>{isEditing ? 'Preview Card' : 'Edit Fields'}</span>
            </button>

            <button
              onClick={handleCreateNewCard}
              className="min-h-[48px] px-5 py-2.5 rounded-2xl border-2 border-slate-900 bg-sky-100 hover:bg-sky-200 text-slate-950 font-black text-sm flex items-center gap-2 transition active:scale-95 shadow-[2px_2px_0px_#0F172A]"
            >
              <Plus className="w-5 h-5 text-sky-700" />
              <span>New Card</span>
            </button>

            {/* Try Again Button */}
            <button
              onClick={handleTryAgain}
              className="min-h-[48px] px-5 py-2.5 rounded-2xl border-2 border-slate-900 bg-amber-100 hover:bg-amber-200 text-slate-950 font-black text-sm flex items-center gap-2 transition active:scale-95 shadow-[2px_2px_0px_#0F172A]"
              title="Reset the form to start fresh"
            >
              <RotateCcw className="w-5 h-5 text-amber-700" />
              <span>Try Again</span>
            </button>

            {/* Save as PNG Button */}
            <button
              onClick={handleSaveAsPNG}
              disabled={isExportingPNG}
              className="min-h-[48px] px-6 py-2.5 rounded-2xl border-2 border-slate-900 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-sm sm:text-base flex items-center gap-2 transition active:scale-95 shadow-[3px_3px_0px_#0F172A]"
              title="Save as PNG image to your iPad or laptop"
            >
              <Download className="w-5 h-5 text-slate-950" />
              <span>{isExportingPNG ? 'Saving...' : 'Save as PNG'}</span>
            </button>
          </div>
        </div>

        {/* Existing Card quick selector */}
        {cards.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto py-3 border-b-2 border-slate-100">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Saved Cards:</span>
            {cards.map((c) => (
              <button
                key={c.id}
                onClick={() => handleSelectCard(c.id)}
                className={`text-sm px-4 py-2 rounded-xl font-bold whitespace-nowrap transition border-2 ${
                  activeCardId === c.id
                    ? 'bg-slate-950 text-amber-300 border-slate-950 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                To: {c.recipientName || 'Draft'}
              </button>
            ))}
          </div>
        )}

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ======================================================== */}
          {/* Form Controls: HIGH-ENERGY & LARGE READABLE FONTS */}
          {/* ======================================================== */}
          {isEditing && (
            <div className="lg:col-span-6 bg-slate-50 p-6 sm:p-7 rounded-3xl border-3 border-slate-900 shadow-[4px_4px_0px_#0F172A] space-y-5">
              <div className="flex items-center justify-between pb-3 border-b-2 border-slate-200">
                <span className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-amber-600" /> Fill Classmate's Card
                </span>
                <span className="text-xs text-amber-950 bg-amber-200 px-3 py-1 rounded-full font-black border border-amber-300">
                  Sec 1-7 CCE
                </span>
              </div>

              <form onSubmit={handleComplete} className="space-y-5">
                {/* Names row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-sm sm:text-base font-black text-slate-900">
                        To (Friend's Name):
                      </label>
                      {roster.length > 0 && (
                        <span className="text-[11px] font-bold text-amber-900 bg-amber-200 px-2 py-0.5 rounded-md">
                          S1-7 Roster
                        </span>
                      )}
                    </div>
                    <div className="space-y-2">
                      {roster.length > 0 && (
                        <div className="relative">
                          <select
                            id="recipient-dropdown-select"
                            value={roster.some((s) => s.name.toLowerCase() === recipientName.toLowerCase()) ? recipientName : ''}
                            onChange={(e) => {
                              playTapSound();
                              if (e.target.value) {
                                setRecipientName(e.target.value);
                              }
                            }}
                            className="w-full p-3.5 pr-10 rounded-2xl border-2 border-slate-900 text-sm sm:text-base font-black bg-amber-100 hover:bg-amber-200 text-slate-950 focus:ring-4 focus:ring-amber-400 focus:outline-hidden cursor-pointer transition appearance-none shadow-xs"
                          >
                            <option value="">▼ Dropdown list: Choose friend ({roster.length} students)...</option>
                            {roster.map((s) => (
                              <option key={s.id} value={s.name}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-950">
                            <ChevronDown className="w-5 h-5" />
                          </div>
                        </div>
                      )}

                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={recipientName}
                          onChange={(e) => setRecipientName(e.target.value)}
                          placeholder={roster.length > 0 ? "Or type / edit friend's name here..." : "e.g. Sarah Lim (Type friend's name)"}
                          className="w-full p-3.5 rounded-2xl border-2 border-slate-900 text-base font-bold bg-white focus:ring-4 focus:ring-amber-300 focus:outline-hidden"
                        />
                        {recipientName && (
                          <button
                            type="button"
                            onClick={() => setRecipientName('')}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-lg"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Quick Roster Classmate Chips */}
                    {roster.length > 0 && (
                      <div className="mt-2 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                        <span className="text-[11px] font-black text-slate-500 whitespace-nowrap">
                          Quick pick:
                        </span>
                        {roster.slice(0, 6).map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => {
                              playTapSound();
                              setRecipientName(s.name);
                            }}
                            className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-white border border-slate-300 hover:border-slate-900 hover:bg-amber-100 text-slate-800 whitespace-nowrap transition"
                          >
                            {s.name.split(' ')[0]}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm sm:text-base font-black text-slate-900 mb-1.5">
                      Sec (Class):
                    </label>
                    <input
                      type="text"
                      required
                      value={classNameVal}
                      onChange={(e) => setClassNameVal(e.target.value)}
                      placeholder="Sec 1-7"
                      className="w-full p-3.5 rounded-2xl border-2 border-slate-900 text-base font-bold bg-white focus:ring-4 focus:ring-amber-300 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* YOU ARE (Beliefs) */}
                <div className="bg-rose-50/70 p-4 rounded-2xl border-2 border-rose-300 space-y-2">
                  <label className="text-sm sm:text-base font-black text-rose-900 flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full bg-rose-500 shrink-0" />
                    YOU ARE (Beliefs & Core Qualities):
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={youAre}
                    onChange={(e) => setYouAre(e.target.value)}
                    placeholder="e.g. Resilient, encouraging, patient, kind to others..."
                    className="w-full p-3.5 rounded-2xl border-2 border-slate-900 text-base font-semibold bg-white focus:ring-4 focus:ring-rose-300 focus:outline-hidden"
                  />
                  {/* Suggestion pills with larger text */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="text-xs font-bold text-rose-700 py-1">Quick ideas:</span>
                    {STRENGTH_SUGGESTIONS.youAre.slice(0, 3).map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          playTapSound();
                          setYouAre(s);
                        }}
                        className="text-xs sm:text-sm font-bold px-3 py-1 rounded-xl bg-white border border-rose-300 text-rose-900 hover:bg-rose-200 transition"
                      >
                        + {s.split(',')[0]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* YOU CAN (Skills) */}
                <div className="bg-emerald-50/70 p-4 rounded-2xl border-2 border-emerald-300 space-y-2">
                  <label className="text-sm sm:text-base font-black text-emerald-900 flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 shrink-0" />
                    YOU CAN (Skills & Strengths):
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={youCan}
                    onChange={(e) => setYouCan(e.target.value)}
                    placeholder="e.g. Explain math clearly, stay calm under pressure, lift our spirits..."
                    className="w-full p-3.5 rounded-2xl border-2 border-slate-900 text-base font-semibold bg-white focus:ring-4 focus:ring-emerald-300 focus:outline-hidden"
                  />
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="text-xs font-bold text-emerald-700 py-1">Quick ideas:</span>
                    {STRENGTH_SUGGESTIONS.youCan.slice(0, 3).map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          playTapSound();
                          setYouCan(s);
                        }}
                        className="text-xs sm:text-sm font-bold px-3 py-1 rounded-xl bg-white border border-emerald-300 text-emerald-900 hover:bg-emerald-200 transition"
                      >
                        + {s.split(' ').slice(0, 3).join(' ')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* YOU HAVE (Support) */}
                <div className="bg-sky-50/70 p-4 rounded-2xl border-2 border-sky-300 space-y-2">
                  <label className="text-sm sm:text-base font-black text-sky-900 flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full bg-sky-500 shrink-0" />
                    YOU HAVE (Support System & Friends):
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={youHave}
                    onChange={(e) => setYouHave(e.target.value)}
                    placeholder="e.g. S1-7 classmates who stand with you, caring teachers, family..."
                    className="w-full p-3.5 rounded-2xl border-2 border-slate-900 text-base font-semibold bg-white focus:ring-4 focus:ring-sky-300 focus:outline-hidden"
                  />
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="text-xs font-bold text-sky-700 py-1">Quick ideas:</span>
                    {STRENGTH_SUGGESTIONS.youHave.slice(0, 2).map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          playTapSound();
                          setYouHave(s);
                        }}
                        className="text-xs sm:text-sm font-bold px-3 py-1 rounded-xl bg-white border border-sky-300 text-sky-900 hover:bg-sky-200 transition"
                      >
                        + {s.split(' ').slice(0, 3).join(' ')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Encouragement prompt */}
                <div className="bg-amber-50/70 p-4 rounded-2xl border-2 border-amber-300 space-y-2">
                  <label className="block text-sm sm:text-base font-black text-slate-900">
                    2. You can get through Term 4 when you...
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={getThroughWhen}
                    onChange={(e) => setGetThroughWhen(e.target.value)}
                    placeholder="e.g. Take one step at a time, remember to breathe, and know you aren't alone..."
                    className="w-full p-3.5 rounded-2xl border-2 border-slate-900 text-base font-semibold bg-white focus:ring-4 focus:ring-amber-300 focus:outline-hidden"
                  />
                </div>

                {/* Sign-off name */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm sm:text-base font-black text-slate-900">
                      Wishing you the best, (Your Name):
                    </label>
                    {currentStudent && (
                      <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300">
                        Me: {currentStudent.name}
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    value={partnerName}
                    onChange={(e) => setPartnerName(e.target.value)}
                    placeholder="e.g. Marcus Tan"
                    className="w-full p-3.5 rounded-2xl border-2 border-slate-900 text-base font-bold bg-white focus:ring-4 focus:ring-amber-300 focus:outline-hidden"
                  />
                </div>

                {/* Form Action Buttons: COMPLETE & TRY AGAIN */}
                <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="submit"
                    className="w-full py-4 px-6 rounded-2xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-base sm:text-lg border-2 border-slate-900 shadow-[3px_3px_0px_#0F172A] flex items-center justify-center gap-2 transition active:scale-95"
                  >
                    <CheckCircle2 className="w-6 h-6 text-slate-950" />
                    <span>Complete</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleTryAgain}
                    className="w-full py-4 px-6 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-black text-base border-2 border-slate-900 shadow-[3px_3px_0px_#0F172A] flex items-center justify-center gap-2 transition active:scale-95"
                  >
                    <RotateCcw className="w-5 h-5 text-slate-700" />
                    <span>Try Again</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ======================================================== */}
          {/* DIGITAL CARD DISPLAY: LARGE READABLE HIGH-ENERGY CANVAS */}
          {/* ======================================================== */}
          <div className={`${isEditing ? 'lg:col-span-6' : 'lg:col-span-12 max-w-3xl mx-auto w-full'}`}>
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" /> Digital Card Preview
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveAsPNG}
                  disabled={isExportingPNG}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 font-black text-xs flex items-center gap-1.5 transition active:scale-95 shadow-sm"
                >
                  <Download className="w-4 h-4 text-amber-300" />
                  <span>Download PNG</span>
                </button>
              </div>
            </div>

            {/* Target element captured for PNG */}
            <div
              ref={cardRef}
              id="finish-well-card-canvas"
              className="bg-white border-4 border-slate-900 rounded-3xl p-6 sm:p-9 shadow-[8px_8px_0px_#0F172A] relative overflow-hidden"
              style={{ minHeight: '520px' }}
            >
              {/* Vibrant Top Color Accent Bar */}
              <div
                className="absolute top-0 left-0 right-0 h-4"
                style={{ backgroundColor: activeTheme.accentHex }}
              />

              {/* Card Header matching physical worksheet with class logo */}
              <div className="flex items-start justify-between border-b-3 border-slate-900 pb-5 mb-5 mt-1">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-black uppercase tracking-wider bg-slate-950 text-amber-300 mb-2">
                    <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                    <span>Sec 1-7 Affirmation Card</span>
                  </div>

                  <h3 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
                    Finish Well Card
                  </h3>

                  <div className="mt-3 space-y-1.5 text-base sm:text-lg">
                    <p className="font-extrabold text-slate-800">
                      <strong>To:</strong>{' '}
                      <span className="border-b-2 border-slate-900 pb-0.5 px-2 font-black text-slate-950 text-xl sm:text-2xl bg-amber-100/70 rounded-md">
                        {recipientName || '______________________'}
                      </span>
                    </p>
                    <p className="font-extrabold text-slate-800">
                      <strong>Class:</strong>{' '}
                      <span className="border-b-2 border-slate-900 pb-0.5 px-2 font-black text-slate-950 bg-amber-100/70 rounded-md">
                        {classNameVal || 'Sec 1-7'}
                      </span>
                    </p>
                  </div>
                </div>

                {/* S1-7 Official Emblem & Resilience Icon at top of card - Single Line Row without frame */}
                <div className="flex flex-row items-center justify-end gap-4 sm:gap-6 md:gap-8 shrink-0">
                  {/* S1-7 Class Logo on its own without frame - bigger and more visible */}
                  <div
                    id="s17-header-logo-container"
                    className="shrink-0 flex items-center justify-center transition-transform hover:scale-105"
                    title="Secondary 1-7 Class Identity: Learning to Learn and Grow Together"
                  >
                    <S17Logo size={130} showSubtitle={true} className="w-24 h-24 sm:w-28 sm:h-28 md:w-34 md:h-34 object-contain filter drop-shadow-sm" />
                  </div>

                  {/* Resilience Tri-color Badge (I am, I can, I have) on the same single line - matching Image 2 */}
                  <div
                    className="w-18 h-18 sm:w-22 sm:h-22 rounded-full border-3 border-slate-900 overflow-hidden relative shadow-[3px_3px_0px_#0F172A] flex items-center justify-center shrink-0"
                    title="Resilience Framework: I am, I can, I have"
                  >
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      {/* 3 Pie Slices */}
                      <path d="M 50 50 L 50 0 A 50 50 0 0 1 93.3 75 Z" fill="#4ADE80" />
                      <path d="M 50 50 L 93.3 75 A 50 50 0 0 1 6.7 75 Z" fill="#38BDF8" />
                      <path d="M 50 50 L 6.7 75 A 50 50 0 0 1 50 0 Z" fill="#FB923C" />
                      {/* Divider lines between slices meeting at center */}
                      <line x1="50" y1="50" x2="50" y2="0" stroke="#0F172A" strokeWidth="2.5" />
                      <line x1="50" y1="50" x2="93.3" y2="75" stroke="#0F172A" strokeWidth="2.5" />
                      <line x1="50" y1="50" x2="6.7" y2="75" stroke="#0F172A" strokeWidth="2.5" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-[10px] sm:text-[11px] font-black text-slate-950 drop-shadow-xs leading-tight">
                      <span>I am</span>
                      <span>I can</span>
                      <span>I have</span>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-sm sm:text-base text-slate-700 font-bold mb-4">
                1. When I consider the <strong>“I am (belief), I can (skills), I have (support)”</strong>, I have observed these to be your strengths:
              </p>

              {/* Box 1: Observed Strengths */}
              <div className="border-2 border-slate-900 rounded-2xl p-5 space-y-4 bg-slate-50/70">
                <div>
                  <span className="text-sm sm:text-base font-black uppercase tracking-wider text-rose-700 block mb-1">
                    YOU ARE:
                  </span>
                  <p className="text-base sm:text-lg text-slate-900 font-bold min-h-[38px] leading-relaxed border-b-2 border-dashed border-slate-300 pb-1.5">
                    {youAre || 'Write what you admire about their character, values, or nature...'}
                  </p>
                </div>

                <div>
                  <span className="text-sm sm:text-base font-black uppercase tracking-wider text-emerald-700 block mb-1">
                    YOU CAN:
                  </span>
                  <p className="text-base sm:text-lg text-slate-900 font-bold min-h-[38px] leading-relaxed border-b-2 border-dashed border-slate-300 pb-1.5">
                    {youCan || 'Write about skills, talents, and capabilities you have seen them demonstrate...'}
                  </p>
                </div>

                <div>
                  <span className="text-sm sm:text-base font-black uppercase tracking-wider text-sky-700 block mb-1">
                    YOU HAVE:
                  </span>
                  <p className="text-base sm:text-lg text-slate-900 font-bold min-h-[38px] leading-relaxed border-b-2 border-dashed border-slate-300 pb-1.5">
                    {youHave || 'Write about the supportive friends, family, and teachers they have around them...'}
                  </p>
                </div>
              </div>

              {/* Box 2: Encouragement */}
              <div className="mt-5 border-2 border-slate-900 rounded-2xl p-5 bg-amber-50/60">
                <span className="text-sm sm:text-base font-black uppercase tracking-wider text-slate-950 block mb-1">
                  2. You can get through Term 4 when you...
                </span>
                <p className="text-base sm:text-lg text-slate-900 font-bold min-h-[50px] leading-relaxed">
                  {getThroughWhen || 'Share your words of encouragement on how they can navigate Term 4 challenges...'}
                </p>
              </div>

              {/* Card Footer with S1-7 Identity */}
              <div className="mt-6 pt-4 border-t-2 border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm sm:text-base font-bold text-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-slate-950 text-white px-2 py-0.5 rounded-md font-black">
                    S1-7
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">
                    Learning to Learn and Grow Together
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-slate-600 font-semibold">Wishing you the best,</span>
                  <span className="border-b-2 border-slate-900 font-black text-slate-950 text-base sm:text-lg px-2">
                    {partnerName || '____________________'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick action bar beneath the preview */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={handleSaveAsPNG}
                disabled={isExportingPNG}
                className="min-h-[48px] px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-amber-300 font-black text-base flex items-center gap-2 transition active:scale-95 shadow-[3px_3px_0px_#0F172A]"
              >
                <Download className="w-5 h-5 text-amber-300" />
                <span>{isExportingPNG ? 'Saving...' : 'Save Card as PNG'}</span>
              </button>

              <button
                onClick={handleComplete}
                className="min-h-[48px] px-6 py-3 rounded-2xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-base flex items-center gap-2 border-2 border-slate-900 shadow-[3px_3px_0px_#0F172A] transition active:scale-95"
              >
                <CheckCircle2 className="w-5 h-5 text-slate-950" />
                <span>Complete</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. CELEBRATION MODAL ON SUCCESSFUL SUBMISSION */}
      {/* ======================================================== */}
      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-9 max-w-lg w-full border-4 border-slate-900 shadow-[8px_8px_0px_#0F172A] text-center space-y-6 relative animate-scale-in">
            <button
              onClick={() => setShowCelebration(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition"
              aria-label="Close celebration modal"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Celebratory Badge */}
            <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-400 border-3 border-slate-900 shadow-[4px_4px_0px_#0F172A] flex items-center justify-center transform rotate-6">
              <PartyPopper className="w-10 h-10 text-slate-950" />
            </div>

            <div className="space-y-2">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-100 text-emerald-950 border border-emerald-300">
                🎉 Finish Well Card Completed!
              </span>
              <h3 className="text-3xl font-black text-slate-950 tracking-tight">
                Awesome Job, S1-7!
              </h3>
              <p className="text-slate-700 font-bold text-base sm:text-lg leading-relaxed">
                You just empowered <strong>{recipientName || 'your classmate'}</strong> with meaningful affirmation and encouragement for Term 4!
              </p>
            </div>

            {/* Actions: Save as PNG or Try Again */}
            <div className="space-y-3 pt-2">
              <button
                onClick={handleSaveAsPNG}
                disabled={isExportingPNG}
                className="w-full py-4 px-6 rounded-2xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-lg border-2 border-slate-900 shadow-[3px_3px_0px_#0F172A] flex items-center justify-center gap-2 transition active:scale-95"
              >
                <Download className="w-6 h-6 text-slate-950" />
                <span>Save as PNG File Now</span>
              </button>

              <button
                onClick={handleTryAgain}
                className="w-full py-3.5 px-6 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-black text-base border-2 border-slate-900 flex items-center justify-center gap-2 transition active:scale-95"
              >
                <RotateCcw className="w-5 h-5 text-slate-700" />
                <span>Write Card for Another Friend</span>
              </button>

              <button
                onClick={() => setShowCelebration(false)}
                className="text-sm font-bold text-slate-500 hover:text-slate-900 underline"
              >
                Back to Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. SLIDE 19: INDIVIDUAL REFLECTION MODULE (03:00 MINS) */}
      {/* ======================================================== */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border-3 border-slate-900 shadow-[6px_6px_0px_#0F172A]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b-2 border-slate-200">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider bg-emerald-100 text-emerald-950 border border-emerald-300 mb-2">
              <Brain className="w-4 h-4 text-emerald-700" />
              <span>Slide 19 • 03:00 Mins Individual Reflection</span>
            </div>
            <h3 className="text-2xl sm:text-4xl font-black text-slate-950 tracking-tight">
              Personal Reflection: Drawing on Your Strengths
            </h3>
            <p className="text-slate-600 font-bold text-base sm:text-lg mt-1">
              Reflect quietly on what your friend noticed in you and commit to one B.A.S.I.C. Ph coping strategy.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveReflection} className="mt-6 space-y-6 max-w-3xl">
          {/* Question 1 */}
          <div className="p-5 rounded-2xl bg-slate-50 border-2 border-slate-300 space-y-2">
            <label className="block text-base sm:text-lg font-black text-slate-950 mb-1">
              • How might you draw on the strength your friend noticed in you to get through Term 4?
            </label>
            <textarea
              rows={3}
              required
              value={reflection.strengthToDrawOn}
              onChange={(e) =>
                setReflection({ ...reflection, strengthToDrawOn: e.target.value })
              }
              placeholder="e.g. When my friend noticed that I am persistent and good at asking questions, it reminded me that asking my math teacher for consultations is a strength, not a weakness..."
              className="w-full p-3.5 rounded-2xl border-2 border-slate-900 text-base font-semibold bg-white focus:ring-4 focus:ring-emerald-300 focus:outline-hidden"
            />
          </div>

          {/* Question 2 */}
          <div className="p-5 rounded-2xl bg-slate-50 border-2 border-slate-300 space-y-3">
            <label className="block text-base sm:text-lg font-black text-slate-950 mb-1">
              • Based on the strength your friend identified in you, describe one B.A.S.I.C. Ph coping strategy you could use when faced with challenges in Term 4:
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {(['B', 'A', 'S', 'I', 'C', 'Ph'] as BasicPhCategory[]).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    playTapSound();
                    setReflection({
                      ...reflection,
                      basicPhCommitment: {
                        ...reflection.basicPhCommitment,
                        channel: cat,
                      },
                    });
                  }}
                  className={`px-4 py-2 rounded-xl text-sm font-black transition border-2 ${
                    reflection.basicPhCommitment.channel === cat
                      ? 'bg-slate-950 text-amber-300 border-slate-950 shadow-xs'
                      : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Channel {cat}
                </button>
              ))}
            </div>

            <textarea
              rows={3}
              required
              value={reflection.basicPhCommitment.description}
              onChange={(e) =>
                setReflection({
                  ...reflection,
                  basicPhCommitment: {
                    ...reflection.basicPhCommitment,
                    description: e.target.value,
                  },
                })
              }
              placeholder="e.g. I will use Physiological (Ph) box breathing for 2 minutes before starting revision blocks, and remind myself (Belief B) that effort counts more than fear..."
              className="w-full p-3.5 rounded-2xl border-2 border-slate-900 text-base font-semibold bg-white focus:ring-4 focus:ring-emerald-300 focus:outline-hidden"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <button
              type="submit"
              className="min-h-[48px] px-7 py-3 rounded-2xl bg-slate-950 hover:bg-slate-800 text-white font-black text-base shadow-[3px_3px_0px_#0F172A] flex items-center gap-2 transition active:scale-95"
            >
              <Save className="w-5 h-5 text-emerald-400" />
              <span>Save Reflection</span>
            </button>

            {reflectionSaved && (
              <span className="flex items-center gap-2 text-sm font-black text-emerald-800 bg-emerald-100 px-4 py-2 rounded-xl border border-emerald-300 animate-fade-in">
                <Check className="w-5 h-5 text-emerald-600" />
                <span>Reflection saved to your device!</span>
              </span>
            )}
          </div>
        </form>
      </section>

      {/* ======================================================== */}
      {/* 5. SLIDE 20: CLOSING SOLIDARITY BANNER */}
      {/* ======================================================== */}
      <section className="bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-300 text-slate-950 rounded-3xl p-6 sm:p-10 border-4 border-slate-900 shadow-[6px_6px_0px_#0F172A] relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-slate-950 text-amber-300">
            <span>S1-7 Solidarity • Slide 20</span>
          </div>
          <h3 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-950 leading-tight">
            Finishing Term 4 Well Together
          </h3>
          <p className="text-lg sm:text-xl font-bold text-slate-900 leading-relaxed">
            Finishing well does not mean that everything will go perfectly or that every outcome will be what we hoped for.
          </p>
          <div className="p-6 rounded-2xl bg-white/90 border-2 border-slate-900 text-slate-950 text-base sm:text-lg leading-relaxed space-y-2 shadow-xs">
            <p className="font-extrabold">
              The <strong>Finish Well Card</strong> is a reminder that you have strengths to draw on, strategies to cope with challenges, and a class that stands with you.
            </p>
            <p className="text-slate-900 font-bold">
              With these, you can face Term 4 with confidence and finish the year well — <strong>together as Sec 1-7!</strong>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
