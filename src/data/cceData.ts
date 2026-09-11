import { BasicPhInfo, Term4Challenge, MemoryNote } from '../types';

export const BASIC_PH_DATA: BasicPhInfo[] = [
  {
    letter: 'B',
    title: 'Beliefs and Values',
    subtitle: 'Tapping on what matters & gives you hope',
    description: 'Remind yourself of what matters to you, what you are working towards, and the values that guide you forward.',
    color: '#EF4444', // Red / Rose
    bgLight: 'bg-rose-50',
    borderLight: 'border-rose-200',
    iconName: 'HeartHandshake',
    examples: [
      'Reflecting on personal purpose, values and beliefs',
      'Reminding yourself: "My marks do not define my whole worth as a person"',
      'Sharing thoughts & hopes with a mentor, teacher, or parent',
      'Finding meaning in working hard for personal growth rather than just grades',
    ],
  },
  {
    letter: 'A',
    title: 'Affect and Emotions',
    subtitle: 'Expressing emotions & feelings safely',
    description: 'Recognise, name and express your emotions in a safe, healthy, and appropriate way without bottling them up.',
    color: '#F97316', // Orange
    bgLight: 'bg-orange-50',
    borderLight: 'border-orange-200',
    iconName: 'Smile',
    examples: [
      'Drawing, writing thoughts, or journaling in a private notebook',
      'Listening to calming or uplifting music playlist',
      'Sharing what you feel with a trusted friend (talking it out, letting yourself cry)',
      'Naming the emotion aloud: "I feel anxious about Math, and that is understandable"',
    ],
  },
  {
    letter: 'S',
    title: 'Social Support',
    subtitle: 'Turning to people for support & helping others',
    description: 'Speak to, seek help from, or spend quality time with people you trust in your class, family, or community.',
    color: '#EAB308', // Yellow / Amber
    bgLight: 'bg-amber-50',
    borderLight: 'border-amber-200',
    iconName: 'Users',
    examples: [
      'Speaking with trusted teachers, form teachers, or school counsellors',
      'Forming study buddy circles with S1-7 classmates to revise together',
      'Staying connected with family and close friends after school',
      'Participating actively in CCA or helping a classmate who is also struggling',
    ],
  },
  {
    letter: 'I',
    title: 'Imagination & Creativity',
    subtitle: 'Using creativity, humour & visualisation',
    description: 'Use visualisation, art, humour, music, or creative play to give your mind a joyful break and shift perspectives.',
    color: '#22C55E', // Green
    bgLight: 'bg-emerald-50',
    borderLight: 'border-emerald-200',
    iconName: 'Palette',
    examples: [
      'Sharing lighthearted moments and laughing with classmates during recess',
      'Visualising yourself walking calmly into the exam hall and finishing strong',
      'Doodling, playing a musical instrument, or creative writing',
      'Watching an inspiring or funny video during scheduled study breaks',
    ],
  },
  {
    letter: 'C',
    title: 'Cognition and Thinking',
    subtitle: 'Facts, logical reasoning & problem-solving',
    description: 'Reframe unhelpful thoughts, organise the problem into bite-sized tasks, and use structured study strategies.',
    color: '#0EA5E9', // Sky Blue
    bgLight: 'bg-sky-50',
    borderLight: 'border-sky-200',
    iconName: 'Brain',
    examples: [
      'Reframing negative thoughts: "I failed this chapter test, but I can revise questions now"',
      'Breaking a massive textbook revision into 30-minute study blocks',
      'Creating a realistic daily revision timetable with buffer rest days',
      'Consulting subject teachers directly with specific questions from past papers',
    ],
  },
  {
    letter: 'Ph',
    title: 'Physiological Actions',
    subtitle: 'Taking care of your body & nervous system',
    description: 'Use breathing, movement, regular rest, sleep, hydration, and nutrition to calm your physical nervous system.',
    color: '#8B5CF6', // Purple
    bgLight: 'bg-purple-50',
    borderLight: 'border-purple-200',
    iconName: 'Activity',
    examples: [
      'Practising 4-4-4-4 Box Breathing before entering the examination room',
      'Getting 7 to 8 hours of sleep each night instead of pulling all-nighters',
      'Doing light physical exercise like jogging, badminton, or brisk walking',
      'Drinking enough water and eating balanced meals during exam weeks',
    ],
  },
];

export const TERM_4_CHALLENGES: Term4Challenge[] = [
  {
    id: 'exam-overwhelm',
    title: 'Feeling overwhelmed by upcoming examinations',
    description: 'Too many subjects, syllabuses to cover, and feeling like there is not enough time before End-of-Year exams.',
    iconName: 'Clock',
    defaultStrategies: [
      {
        channel: 'C',
        action: 'Break revision into daily micro-goals using a revision checklist.',
        reason: 'Prevents feeling paralyzed by seeing the whole mountain at once.',
      },
      {
        channel: 'Ph',
        action: 'Do 2 minutes of box breathing whenever anxiety peaks during study.',
        reason: 'Lowers heart rate and brings prefrontal cortex back online.',
      },
      {
        channel: 'S',
        action: 'Form an after-school revision pod with S1-7 friends.',
        reason: 'Provides mutual encouragement and solves doubts faster.',
      },
    ],
  },
  {
    id: 'disappointing-result',
    title: 'Receiving a disappointing result',
    description: 'Working hard but getting lower marks than hoped for in Weighted Assessment 3 or practice papers.',
    iconName: 'FileX',
    defaultStrategies: [
      {
        channel: 'A',
        action: 'Acknowledge disappointment and talk to a trusted friend or parent.',
        reason: 'Bottling up sadness leads to burnout; sharing it relieves emotional pressure.',
      },
      {
        channel: 'C',
        action: 'Do an error analysis with the teacher to identify specific learning gaps.',
        reason: 'Shifts focus from "I am bad at this" to "These 3 question types need practice".',
      },
      {
        channel: 'B',
        action: 'Remind myself that learning is a marathon and this test is feedback, not my final identity.',
        reason: 'Builds growth mindset and long-term resilience.',
      },
    ],
  },
  {
    id: 'classmate-comparison',
    title: 'Comparing yourself with classmates',
    description: 'Feeling inferior when seeing peers finish work quickly, achieve high scores, or grasp concepts easily.',
    iconName: 'Users',
    defaultStrategies: [
      {
        channel: 'B',
        action: 'Focus on your own personal growth trajectory from Term 1 to now.',
        reason: 'The only meaningful comparison is with your former self.',
      },
      {
        channel: 'I',
        action: 'Use positive visualisation of your personal effort and triumphs.',
        reason: 'Interrupts toxic comparison loops with empowering self-narratives.',
      },
      {
        channel: 'C',
        action: 'Notice that everyone has different strengths (some excel in Arts, some in Sports, some in Sciences).',
        reason: 'Logical reframing eliminates unfair single-metric rankings.',
      },
    ],
  },
  {
    id: 'peer-tension',
    title: 'Experiencing tension with friends',
    description: 'Misunderstandings, group project disagreements, or feeling excluded under high year-end stress.',
    iconName: 'MessageSquare',
    defaultStrategies: [
      {
        channel: 'S',
        action: 'Have an open, calm 1-to-1 conversation over recess or ask a teacher to mediate.',
        reason: 'Direct gentle communication resolves assumptions before they fester.',
      },
      {
        channel: 'A',
        action: 'Write out your honest feelings in a journal before speaking.',
        reason: 'Helps cool down heated emotions so words don’t hurt others.',
      },
      {
        channel: 'B',
        action: 'Value the friendship and remember that stress makes people react more sharply than usual.',
        reason: 'Practising empathy keeps relationships intact.',
      },
    ],
  },
  {
    id: 'low-motivation',
    title: 'Feeling tired or unmotivated near year end',
    description: 'Feeling drained after 3 rigorous terms, low energy, and wishing the school holidays were already here.',
    iconName: 'BatteryLow',
    defaultStrategies: [
      {
        channel: 'Ph',
        action: 'Strictly protect 8 hours of sleep and take 15-minute screen-free walks outside.',
        reason: 'Restores baseline physical energy without caffeine or late nights.',
      },
      {
        channel: 'I',
        action: 'Create a motivating countdown visual board and plan rewarding holiday milestones.',
        reason: 'Gives the brain an exciting horizon to look forward to.',
      },
      {
        channel: 'C',
        action: 'Set tiny 20-minute study sprints with rewarding 5-minute stretch breaks.',
        reason: 'Overcomes procrastination inertia easily.',
      },
    ],
  },
  {
    id: 'fear-of-disappointing',
    title: 'Worrying about disappointing others (e.g. parents)',
    description: 'Carrying high expectations from family or teachers and fearing that falling short will let them down.',
    iconName: 'ShieldAlert',
    defaultStrategies: [
      {
        channel: 'S',
        action: 'Share your worries honestly with your parents: "I am trying my best, and I feel anxious".',
        reason: 'Often reveals parents care far more about your health and effort than perfection.',
      },
      {
        channel: 'B',
        action: 'Ground yourself in knowing you are putting in genuine, honest effort.',
        reason: 'Effort is within our control; exact exam conditions are not always.',
      },
      {
        channel: 'Ph',
        action: 'Release physical tension through sports, brisk walks, or box breathing.',
        reason: 'Discharges somatic stress and tightness in the shoulders and chest.',
      },
    ],
  },
];

// Do not prefill post-it notes with fake samples
export const STARTER_MEMORIES: MemoryNote[] = [];

export const STRENGTH_SUGGESTIONS = {
  youAre: [
    'A deeply resilient and patient learner',
    'A kind and encouraging classmate who lifts others up',
    'Dependable, honest, and hardworking in every team project',
    'Thoughtful, observant, and deeply caring towards friends',
    'Courageous in speaking up and asking good questions',
    'Calm and steady even when deadlines get hectic',
  ],
  youCan: [
    'Explain tricky concepts clearly and patiently to peers',
    'Bring humor, warmth, and laughter when the class is stressed',
    'Stay focused and finish tasks step-by-step',
    'Listen attentively without judging others',
    'Persevere through tough test questions and not give up',
    'Organize your notes and plan your revision systematically',
  ],
  youHave: [
    'A whole class of S1-7 friends who genuinely support you',
    'Caring teachers who are always ready to answer your questions',
    'A family and loved ones who believe in your potential',
    'The growth and endurance you built across Terms 1, 2, and 3',
    'A strong personal determination that has carried you this far',
  ],
};
