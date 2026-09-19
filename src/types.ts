export type Language = 'en' | 'hi';

export type TextSize = 'normal' | 'large' | 'xlarge' | 'huge';

export type ThemeContrast = 'standard' | 'high' | 'normal';

export type ActiveTab = 
  | 'home'
  | 'news'
  | 'scam-shield'
  | 'medicines'
  | 'bills'
  | 'how-to'
  | 'family'
  | 'companion';

export type NewsCategory = 'all' | 'important' | 'schemes' | 'health' | 'local' | 'weather';

export interface NewsArticle {
  id: string;
  title: string;
  titleHi: string;
  summary: string;
  summaryHi: string;
  fullStory: string;
  fullStoryHi: string;
  category: 'important' | 'schemes' | 'health' | 'local' | 'weather';
  categoryLabel: string;
  categoryLabelHi: string;
  isImportantAlert?: boolean;
  dateLabel: string; // e.g., "Today, Morning", "Today, Afternoon", "Yesterday"
  dateLabelHi: string;
  region: string; // e.g., "National", "Delhi NCR", "Mumbai", "Lucknow", "Jaipur", "Bengaluru"
  regionHi: string;
  takeaway: string; // 1-line key action or takeaway for senior
  takeawayHi: string;
  source: string;
  sourceHi: string;
  readTimeMinutes: number;
}

export interface Medicine {
  id: string;
  name: string;
  hindiName: string;
  dosage: string;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  timeLabel: string;
  takenToday: boolean;
  withFood: boolean;
  notes: string;
}

export interface ScamAnalysisResult {
  verdict: 'safe' | 'warning' | 'dangerous_scam';
  score: number;
  title: string;
  explanation: string;
  redFlags: string[];
  safeActions: string[];
  reassurance: string;
}

export interface DocumentAnalysisResult {
  summary: string;
  whatIsThis: string;
  amountToPay: string;
  dueDate: string;
  keyPoints: string[];
  actionSteps: string[];
  easyExplanation: string;
}

export interface MedicineAnalysisResult {
  name: string;
  purpose: string;
  whenToTake: string;
  importantCautions: string[];
  friendlyTip: string;
}

export interface ChatMessage {
  id: string;
  role?: 'user' | 'model';
  sender?: 'user' | 'saathi';
  content?: string;
  text: string;
  timestamp: string | Date;
}

export interface FamilyContact {
  id: string;
  name: string;
  relation: string;
  relationHi: string;
  phone: string;
  avatarBg: string;
  initials: string;
}

export interface StepGuide {
  id: string;
  titleEn: string;
  titleHi: string;
  category: 'banking' | 'communication' | 'health' | 'safety';
  iconName: string;
  steps: {
    stepNumber: number;
    headingEn: string;
    headingHi: string;
    descriptionEn: string;
    descriptionHi: string;
    cautionEn?: string;
    cautionHi?: string;
    actionLabelEn?: string;
    actionLabelHi?: string;
  }[];
}
