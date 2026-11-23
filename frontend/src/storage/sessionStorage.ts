/**
 * src/storage/sessionStorage.ts
 * In-Memory & Session Isolation Manager.
 * Strictly enforces Day 12 Privacy Policy:
 *   - Category A data (PHQ-9 items, Item 9, severity, crisis logs) are NEVER stored in localStorage.
 *   - All state is held in volatile React memory for the active browser session.
 */

import type { StudentSurveyFeatures } from '../contracts/featureContract.ts';
import { DEFAULT_SURVEY_FEATURES } from '../contracts/featureContract.ts';
import type { PHQ9Result } from '../engines/wellbeingEngine.ts';

export type NavigationScreen =
  | 'welcome'
  | 'login'
  | 'signup'
  | 'parent_info'
  | 'student_info'
  | 'assessment'
  | 'dashboard'
  | 'wellbeing'
  | 'risk_insights'
  | 'profile'
  | 'daily_checkin'
  | 'goals'
  | 'activity_history'
  | 'wellness_studio'
  | 'breathing'
  | 'grounding'
  | 'focus_timer'
  | 'muscle_relaxation'
  | 'recommendations'
  | 'guardian_info'
  | 'email_notifications'
  | 'notification_history'
  | 'privacy_security'
  | 'data_center'
  | 'settings'
  | 'help_support'
  | 'support'
  | 'model_lab'
  | 'model_comparison'
  | 'real_world_163'
  | 'large_dataset'
  | 'explainability'
  | 'personal_goals'
  | 'guardian_support'
  | 'privacy_center'
  | 'profile_settings'
  | 'ai_companion'
  | 'ai_feelings_space'
  | 'weekly_insights'
  | 'assessment_history'
  | 'personal_journal'
  | 'relaxation_exercises'
  | 'personalized_activities'
  | 'ai_recommendations'
  | 'learning_hub'
  | 'mini_games'
  | 'ambient_music';

export interface AppState {
  currentScreen: NavigationScreen;
  surveyFeatures: StudentSurveyFeatures;
  phq9Answers: number[];
  phq9Result: PHQ9Result | null;
  assessmentCompleted: boolean;
  selectedCountry: string;
  hasConsented: boolean;
  isPreviewMode: boolean;
  habitChecklist: Record<string, boolean>;
}

export const INITIAL_APP_STATE: AppState = {
  currentScreen: 'welcome',
  surveyFeatures: { ...DEFAULT_SURVEY_FEATURES },
  phq9Answers: [0, 0, 0, 0, 0, 0, 0, 0, 0],
  phq9Result: null,
  assessmentCompleted: false,
  selectedCountry: 'India',
  hasConsented: false,
  isPreviewMode: false,
  habitChecklist: {
    'rec-sleep': false,
    'rec-study': false,
    'rec-stress': false
  }
};

/**
 * Validated synthetic sample data for instant educational exploration.
 * Clearly labeled as PREVIEW DATA (never claimed to be actual student results).
 */
export const SAMPLE_PREVIEW_STATE: AppState = {
  currentScreen: 'dashboard',
  surveyFeatures: {
    age: 20,
    gender: 'Female',
    degree: 'B.Tech',
    cgpa: 8.2,
    academicPressure: 3,
    studySatisfaction: 4,
    workStudyHours: 7.0,
    financialStress: 2,
    sleepDuration: '7-8 hours',
    dietaryHabits: 'Healthy'
  },
  phq9Answers: [1, 1, 0, 1, 0, 0, 1, 0, 0],
  phq9Result: {
    totalScore: 4,
    maxScore: 27,
    severity: 'Minimal',
    description: 'Responses indicate minimal symptoms over the past two weeks.',
    badgeColor: '#10B981',
    badgeBg: '#ECFDF5',
    item9Score: 0,
    hasSelfHarmRisk: false
  },
  assessmentCompleted: true,
  selectedCountry: 'India',
  hasConsented: true,
  isPreviewMode: true,
  habitChecklist: {
    'rec-sleep': true,
    'rec-study': false,
    'rec-stress': false
  }
};

/**
 * Volatile Session Isolation Closure.
 * Strictly avoids localStorage or sessionStorage for sensitive student data.
 */
interface SessionCache {
  surveyFeatures?: StudentSurveyFeatures;
  lifestyleInputs?: Record<string, any>;
  completedAt?: string;
}

let inMemorySession: SessionCache = {};

export const sessionStore = {
  saveSession(features: StudentSurveyFeatures, lifestyle?: Record<string, any>): void {
    inMemorySession = {
      surveyFeatures: { ...features },
      lifestyleInputs: lifestyle ? { ...lifestyle } : undefined,
      completedAt: new Date().toISOString()
    };
  },

  getSession(): SessionCache {
    return { ...inMemorySession };
  },

  clearSession(): void {
    inMemorySession = {};
  }
};
