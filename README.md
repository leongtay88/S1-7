# S1-7 Term 4 Check-in & Finish Well 🌟

An interactive, iPad-friendly Character and Citizenship Education (CCE) web application designed for Secondary 1-7 students to reflect on their Term 4 wellbeing, discover coping strategies through the **B.A.S.I.C. Ph** model, and exchange encouraging **"Finish Well"** peer affirmation cards.

---

## 🎯 Overview & Learning Objectives

1. **Check-in on Sentiments**: Gauge student emotional readiness, exam stress, and energy levels for Term 4 through an interactive Emotion Thermometer.
2. **Explore Coping Strategies (B.A.S.I.C. Ph)**: Unpack evidence-based coping channels (Belief, Affect, Social, Imagination, Cognitive, Physiology) paired with an interactive 4-4-4-4 Box Breathing exercise.
3. **Finish Well Together**: Craft personalized peer affirmation cards using the resilience formula:
   - **YOU ARE** *(Internal strengths & character traits)*
   - **YOU CAN** *(Skills, capabilities & agency)*
   - **YOU HAVE** *(External support, friends & community)*
4. **Real-Time Teacher Visibility**: Empower educators with a live classroom dashboard to monitor student engagement, class sentiment trends, and card distribution in real time.

---

## ✨ Features

### 1. Student Check-In & Class Roster
- Preloaded with the official **Sec 1-7 Class Roster** with support for quick CSV/text file roster imports.
- One-tap student check-in with personalized avatars, class numbering, and local storage retention.
- Instant QR code generator for students to pair devices or access the app from personal iPads.

### 2. Part 1: Term 4 Sentiments
- **Emotion Thermometer**: 5 distinct emotional zones (Energized, Calm & Steady, Mixed/Uncertain, Nervous/Stressed, Overwhelmed).
- **Anonymous Polling**: Live sentiment visualization allowing students to see collective class feelings without fear of judgment.
- **Top Term 4 Concerns**: Guided checklist covering end-of-year exams, project deadlines, subject streaming, and energy management.

### 3. Part 2: B.A.S.I.C. Ph Coping Framework
- **Official B.A.S.I.C. Ph Infographic**: High-resolution reference chart covering all 6 coping modalities:
  - **B** – Belief (values, core beliefs, purpose)
  - **A** – Affect (emotional expression, journaling, music)
  - **S** – Social (friendships, CCA, trusted adults)
  - **I** – Imagination (humour, creativity, positive distractions)
  - **C** – Cognitive (problem-solving, reframing, planning)
  - **Ph** – Physiology (exercise, sports, sleep, hydration, nutrition)
- **Interactive Zoom Modal**: Pinch-to-zoom and full-screen view tailored for iPad and tablet viewing.
- **Group Strategy Wall**: Collaborative brainstorming space for tables/groups to submit and upvote coping hacks.
- **Guided 4-4-4-4 Box Breathing**: Animated breathing ring with gentle chime audio cues to center students before the activity.

### 4. Part 3: "Finish Well" Peer Affirmation Card Creator
- **Live Canvas Card Generator**: Generates high-contrast digital cards with custom stamps, signatures, and Sec 1-7 branding.
- **Color Themes**: Gold Spark, Ocean Breeze, Sunset Coral, Emerald Grove, and Electric Violet.
- **iPad & Mobile Photo Saving**:
  - Integrated with the **Web Share API** (`navigator.share`) to save directly to iPad **Apple Photos**.
  - Long-press touch saving modal with one-tap clipboard copying.
  - Automatic fallback to high-resolution PNG download for laptop browsers.
- **Personal Reflection Journal**: Individual post-activity prompt saved locally to the student's device.

### 5. Teacher Dashboard & Classroom Control
- **Live Class Overview**: Instant count of checked-in students and completion rates for Sentiments, Strategies, and Cards.
- **Classroom Timer**: Preset countdown timers (3m, 5m, 10m, 15m) with audio notifications.
- **Data Export**: Export student responses, reflections, and participation metrics as JSON or CSV.
- **Multi-Tab Live Sync**: Uses the browser's `BroadcastChannel` and `localStorage` to synchronize teacher and student screens instantly without requiring external backend servers.

---

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler & Dev Server**: [Vite 6](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Animations**: [Motion](https://motion.dev/)
- **Graphics & Export**: HTML5 Canvas, [html2canvas](https://html2canvas.hertzen.com/), [canvas-confetti](https://github.com/catdad/canvas-confetti), [qrcode](https://github.com/soldair/node-qrcode)

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18.0 or higher recommended)
- [npm](https://www.npmjs.com/) (version 9.0 or higher)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/s1-7-term4-cce.git
   cd s1-7-term4-cce
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the local development server:**
   ```bash
   npm run dev
   ```
   Open your browser and navigate to `http://localhost:3000`.

4. **Typecheck & Lint:**
   ```bash
   npm run lint
   ```

5. **Build for Production:**
   ```bash
   npm run build
   ```
   The compiled static assets will be output to the `dist/` directory, ready to be hosted on GitHub Pages, Vercel, Netlify, or Cloud Run.

---

## 📂 Project Structure

```text
├── public/
│   ├── BASIC-Ph.png            # Official high-resolution B.A.S.I.C. Ph infographic
│   ├── s1-7-logo.png           # S1-7 class crest & branding assets
│   ├── class-list.csv          # Preconfigured Sec 1-7 student roster
│   └── class-list.txt          # Plaintext student roster backup
├── src/
│   ├── components/
│   │   ├── BasicPhReferenceBox.tsx    # Infographic embed & modal zoom viewer
│   │   ├── BoxBreathingGuide.tsx      # Interactive 4-4-4-4 box breathing guide
│   │   ├── ClassroomTimer.tsx         # Teacher countdown timer with sound alerts
│   │   ├── HeaderNav.tsx              # Navigation bar, student badge, teacher toggle
│   │   ├── LessonOverview.tsx         # Introduction & lesson objectives
│   │   ├── Part1Sentiments.tsx        # Emotion thermometer & worries poll
│   │   ├── Part2BasicPh.tsx           # Coping channels, wall & breathing
│   │   ├── Part3FinishWell.tsx        # Card maker, live canvas export, iPad modal
│   │   ├── StudentCheckInModal.tsx    # Roster selector & check-in flow
│   │   └── TeacherDashboard.tsx       # Live analytics & responses oversight
│   ├── data/
│   │   ├── basicPhData.ts             # Embedded base64 fallback & SVG metadata
│   │   ├── cceData.ts                 # Coping strategies content & challenge prompts
│   │   └── s17LogoData.ts             # Embedded vector logo fallback
│   ├── utils/
│   │   ├── liveSync.ts                # BroadcastChannel real-time sync across devices
│   │   ├── sessionStore.ts            # Local persistence & state management
│   │   └── sound.ts                   # Web Audio API synthesizers (fanfare & chimes)
│   ├── App.tsx                        # Main application orchestrator
│   ├── main.tsx                       # React application entry point
│   ├── types.ts                       # Shared TypeScript interfaces & types
│   └── index.css                      # Tailwind CSS entry point
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 📱 iPad & Classroom Facilitation Tips

1. **Saving Cards to iPad Photos**:
   - Students tap **"Save as PNG"** or **"Save to Photos"**.
   - On Safari for iPad, the iOS Share Sheet will appear. Tap **"Save Image"** to place the card straight into the **Photos** app.
   - Alternatively, students can press and hold the card preview to copy or save.
2. **Device Sharing**:
   - Tap the QR code button in the header navigation to display a full-screen QR code for students to scan with their iPads.
3. **Privacy by Design**:
   - All student entries and check-ins are kept locally within browser memory and local storage, ensuring complete student privacy with zero third-party telemetry.

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
