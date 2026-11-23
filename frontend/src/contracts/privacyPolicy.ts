/**
 * src/contracts/privacyPolicy.ts
 * Mindora 2.0 Privacy Classification & Retention Specification.
 * Enforces zero-persistence for Category A psychometric and crisis data.
 */

export const CATEGORY_A_FIELDS = [
  'phq9_answers',
  'phq9_item_9',
  'phq9_total_score',
  'phq9_severity',
  'has_self_harm_risk',
  'optional_notes',
  'crisis_helpline_access'
] as const;

export const CATEGORY_B_FIELDS = [
  'age',
  'gender',
  'degree',
  'cgpa',
  'academicPressure',
  'studySatisfaction',
  'workStudyHours',
  'financialStress',
  'sleepDuration',
  'dietaryHabits'
] as const;

export interface PrivacyConsentState {
  hasConsented: boolean;
  consentTimestamp: string | null;
  privacyNoticeAcknowledged: boolean;
  ephemeralSessionOnly: boolean;
}

export const INITIAL_CONSENT_STATE: PrivacyConsentState = {
  hasConsented: false,
  consentTimestamp: null,
  privacyNoticeAcknowledged: false,
  ephemeralSessionOnly: true
};
