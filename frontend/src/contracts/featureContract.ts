/**
 * src/contracts/featureContract.ts
 * Mindora 2.0 Feature Contract.
 * Defines the 10 approved clean student survey features.
 * Excludes raw target tokens and demographic identifiers.
 */

export interface StudentSurveyFeatures {
  age: number;
  gender: 'Female' | 'Male';
  degree: string;
  cgpa: number;
  academicPressure: number; // 1 to 5
  studySatisfaction: number; // 1 to 5
  workStudyHours: number; // 1 to 14
  financialStress: number; // 1 to 5
  sleepDuration: string;
  dietaryHabits: string;
}

export const APPROVED_FEATURE_COUNT = 10;

export const DEGREE_OPTIONS = [
  'B.Arch', 'B.Com', 'B.Ed', 'B.Pharm', 'B.Tech', 'BA', 'BBA', 'BCA',
  'BE', 'BHM', 'BSc', 'Class 12', 'LLB', 'LLM', 'M.Com', 'M.Ed',
  'M.Pharm', 'M.Tech', 'MA', 'MBA', 'MBBS', 'MCA', 'MD', 'ME',
  'MHM', 'MSc', 'Others', 'PhD'
] as const;

export const SLEEP_DURATION_OPTIONS = [
  'Less than 5 hours',
  '5-6 hours',
  '7-8 hours',
  'More than 8 hours',
  'Others'
] as const;

export const DIETARY_HABITS_OPTIONS = [
  'Healthy',
  'Moderate',
  'Unhealthy',
  'Others'
] as const;

export const DEFAULT_SURVEY_FEATURES: StudentSurveyFeatures = {
  age: 21,
  gender: 'Female',
  degree: 'B.Tech',
  cgpa: 7.8,
  academicPressure: 3,
  studySatisfaction: 3,
  workStudyHours: 6.5,
  financialStress: 3,
  sleepDuration: '7-8 hours',
  dietaryHabits: 'Moderate'
};
