export type SentimentType = 'manageable' | 'mixed' | 'heavy';

export interface SentimentVote {
  type: SentimentType;
  timestamp: number;
}

export type MemoryCategory = 
  | 'supporting'
  | 'challenges'
  | 'moments'
  | 'learning'
  | 'changed';

export interface MemoryNote {
  id: string;
  category: MemoryCategory;
  author: string;
  text: string;
  likes: number;
  color: 'yellow' | 'pink' | 'blue' | 'green' | 'purple' | 'orange';
}

export type BasicPhCategory = 'B' | 'A' | 'S' | 'I' | 'C' | 'Ph';

export interface BasicPhInfo {
  letter: BasicPhCategory;
  title: string;
  subtitle: string;
  description: string;
  color: string;
  bgLight: string;
  borderLight: string;
  iconName: string;
  examples: string[];
}

export interface Term4Challenge {
  id: string;
  title: string;
  description: string;
  iconName: string;
  defaultStrategies: {
    channel: BasicPhCategory;
    action: string;
    reason: string;
  }[];
}

export interface GroupStrategyEntry {
  id: string;
  challengeId: string;
  groupName: string;
  strategies: {
    channel: BasicPhCategory;
    strategy: string;
    whyHelpful: string;
  }[];
  createdAt: number;
}

export interface FinishWellCardData {
  id: string;
  recipientName: string;
  className: string;
  youAre: string; // I am (belief)
  youCan: string; // I can (skills)
  youHave: string; // I have (people they can count on)
  getThroughWhen: string; // You can get through Term 4 when you...
  partnerName: string; // Wishing you the best in Term 4 and beyond, [name]
  themeColor?: string;
  createdAt: number;
}

export interface IndividualReflectionData {
  strengthToDrawOn: string;
  basicPhCommitment: {
    channel: BasicPhCategory;
    description: string;
  };
  savedAt: number;
}

export interface StudentRosterItem {
  id: string;
  name: string;
  hasJoined: boolean;
  joinedAt?: number;
  sentimentVote?: SentimentType;
  sentimentTime?: number;
  memoryNoteCount: number;
  groupContributionsCount: number;
  cardsSentCount: number;
  cardRecipientName?: string;
  cardSnippet?: string;
  reflectionCompleted: boolean;
  reflectionChannel?: BasicPhCategory;
  reflectionText?: string;
  completionScore: number; // 0 to 100
}

export interface SessionConfig {
  sessionCode: string;
  className: string;
  teacherName: string;
  startedAt: number;
}
